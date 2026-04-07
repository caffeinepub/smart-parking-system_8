import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Map "mo:core/Map";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Iter "mo:core/Iter";
import Nat32 "mo:core/Nat32";
import Principal "mo:core/Principal";
import Int "mo:core/Int";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  type UserId = Principal;
  type EpochTime = Int;

  type VehicleType = {
    #twoWheeler;
    #fourWheeler;
  };

  type PasswordHash = Text;

  type SlotId = Nat32;

  type UserProfile = {
    username : Text;
    vehicleNumber : Text;
    vehicleType : VehicleType;
  };

  type ParkingSlot = {
    id : SlotId;
    name : Text;
    vehicleType : ?VehicleType;
    isOccupied : Bool;
  };

  type ParkingSessionId = Text;

  type ParkingSession = {
    customerId : UserId;
    entryTime : EpochTime;
    slotId : SlotId;
    vehicleNumber : Text;
    vehicleType : VehicleType;
    exitTime : ?EpochTime;
    totalCost : ?Nat;
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let userProfiles = Map.empty<Principal, UserProfile>();
  let parkingSlots = Map.empty<SlotId, ParkingSlot>();
  let parkingSessions = Map.empty<ParkingSessionId, ParkingSession>();
  var sessionIdCounter : Nat = 0;

  var twoWheelerHourlyRate : Nat = 10;
  var fourWheelerHourlyRate : Nat = 20;
  var dailyIncome : Nat = 0;
  var monthlyIncome : Nat = 0;

  // User Profile Management (required by frontend)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Public function - anyone can view available slots
  public query ({ caller }) func getAvailableSlots() : async [ParkingSlot] {
    parkingSlots.values().filter(func(slot) { not slot.isOccupied }).toArray();
  };

  // Admin or owner can view a specific session
  public query ({ caller }) func getParkingSession(sessionId : ParkingSessionId) : async ?ParkingSession {
    switch (parkingSessions.get(sessionId)) {
      case (null) { null };
      case (?session) {
        if (not AccessControl.isAdmin(accessControlState, caller) and session.customerId != caller) {
          Runtime.trap("Unauthorized: Can only view your own sessions");
        };
        ?session;
      };
    };
  };

  // Admin-only: view all parking sessions
  public query ({ caller }) func getAllParkingSessions() : async [ParkingSession] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all sessions");
    };
    parkingSessions.values().toArray();
  };

  // User can view their own sessions
  public query ({ caller }) func getCustomerSessions() : async [ParkingSession] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their sessions");
    };
    parkingSessions.values().filter(func(session) { session.customerId == caller }).toArray();
  };

  // Admin-only: add or update parking slot
  public shared ({ caller }) func addOrUpdateParkingSlot(slotName : Text, vehicleType : ?VehicleType) : async SlotId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can manage parking slots");
    };

    let newId = Nat32.fromNat(parkingSlots.size());

    let slot : ParkingSlot = {
      id = newId;
      name = slotName;
      vehicleType;
      isOccupied = false;
    };

    parkingSlots.add(newId, slot);
    newId;
  };

  // Admin-only: remove parking slot
  public shared ({ caller }) func removeParkingSlot(slotId : SlotId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can manage parking slots");
    };

    switch (parkingSlots.get(slotId)) {
      case (null) { Runtime.trap("Parking slot not found") };
      case (?slot) {
        if (slot.isOccupied) {
          Runtime.trap("Cannot remove occupied slot");
        };
        parkingSlots.remove(slotId);
      };
    };
  };

  // Admin-only: set pricing
  public shared ({ caller }) func setPricing(twoWheelerRate : Nat, fourWheelerRate : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set pricing");
    };

    twoWheelerHourlyRate := twoWheelerRate;
    fourWheelerHourlyRate := fourWheelerRate;
  };

  // Users can view pricing (customers need to know rates before parking)
  public query ({ caller }) func getPricing() : async (Nat, Nat) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view pricing");
    };
    (twoWheelerHourlyRate, fourWheelerHourlyRate);
  };

  // Admin-only: get income statistics
  public query ({ caller }) func getIncomeStats() : async {
    dailyIncome : Nat;
    monthlyIncome : Nat;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view income stats");
    };
    { dailyIncome; monthlyIncome };
  };

  // Admin or owner can finalize session
  public shared ({ caller }) func finalizeParkingSession(sessionId : ParkingSessionId) : async ParkingSession {
    switch (parkingSessions.get(sessionId)) {
      case (null) { Runtime.trap("Parking session not found") };
      case (?session) {
        if (not AccessControl.isAdmin(accessControlState, caller) and session.customerId != caller) {
          Runtime.trap("Unauthorized: Can only finalize your own sessions");
        };

        if (session.exitTime != null) {
          Runtime.trap("This session has already been finalized");
        };

        let exitTime = Time.now();
        let durationNanos = exitTime - session.entryTime;
        let durationHours = (durationNanos / 1_000_000_000 / 3600) + 1; // Round up to next hour

        let hourlyRate = switch (session.vehicleType) {
          case (#twoWheeler) { twoWheelerHourlyRate };
          case (#fourWheeler) { fourWheelerHourlyRate };
        };

        let finalCost = Int.abs(durationHours) * hourlyRate;

        dailyIncome += finalCost;
        monthlyIncome += finalCost;

        let finalizedSession : ParkingSession = {
          session with
          exitTime = ?exitTime;
          totalCost = ?finalCost;
        };

        switch (parkingSlots.get(session.slotId)) {
          case (null) { () };
          case (?slot) {
            parkingSlots.add(slot.id, { slot with isOccupied = false });
          };
        };

        parkingSessions.add(sessionId, finalizedSession);
        finalizedSession;
      };
    };
  };

  // User-only: register parking session
  public shared ({ caller }) func registerParkingSession(slotId : SlotId, vehicleNumber : Text, vehicleType : VehicleType) : async ParkingSessionId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can register parking sessions");
    };

    if (vehicleNumber.trim(#char ' ').size() == 0) {
      Runtime.trap("Vehicle number cannot be empty or blank");
    };

    switch (parkingSlots.get(slotId)) {
      case (null) { Runtime.trap("Parking slot not found") };
      case (?slot) {
        if (slot.isOccupied) {
          Runtime.trap("The slot is already occupied");
        };

        // Check if slot supports this vehicle type
        switch (slot.vehicleType) {
          case (?slotVehicleType) {
            if (slotVehicleType != vehicleType) {
              Runtime.trap("Slot does not support this vehicle type");
            };
          };
          case (null) { /* Slot supports any vehicle type */ };
        };

        sessionIdCounter += 1;
        let sessionId = "SESSION-" # sessionIdCounter.toText();

        let session : ParkingSession = {
          customerId = caller;
          slotId;
          vehicleNumber;
          vehicleType;
          entryTime = Time.now();
          exitTime = null;
          totalCost = null;
        };

        parkingSessions.add(sessionId, session);

        let updatedSlot : ParkingSlot = { slot with isOccupied = true };
        parkingSlots.add(slotId, updatedSlot);

        sessionId;
      };
    };
  };

  module ParkingSession {
    public func compareByEntryTimeDescending(session1 : ParkingSession, session2 : ParkingSession) : Order.Order {
      Int.compare(session2.entryTime, session1.entryTime);
    };
  };

  // User can get their latest vehicle number
  public query ({ caller }) func getLatestVehicleNumber() : async ?Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their vehicle information");
    };

    let customerSessions = parkingSessions.values().filter(func(session) {
      session.customerId == caller
    }).toArray();

    if (customerSessions.size() == 0) {
      return null;
    };

    let sortedSessions = customerSessions.sort(ParkingSession.compareByEntryTimeDescending);

    ?sortedSessions[0].vehicleNumber;
  };
};
