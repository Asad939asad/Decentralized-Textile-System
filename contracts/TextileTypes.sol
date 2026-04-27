// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// ═══════════════════════════════════════════════════════════════════════════
//  GLOBAL ENUMS
// ═══════════════════════════════════════════════════════════════════════════
enum ActorRole {
    None,
    Farmer,
    Vendor,
    QualityInspector,
    DepartmentHead,
    LogisticsAgent,
    FinanceOfficer,
    RetailOutlet,
    OnlineStore,
    Auditor
}
enum FiberType {
    Cotton,
    Wool,
    Silk,
    Linen,
    Synthetic,
    Blended
}
enum QualityGrade {
    Rejected,
    Standard,
    Premium,
    Luxury
}
enum Department {
    Sourcing,
    Spinning,
    Weaving,
    Dyeing,
    Cutting,
    Stitching,
    Finishing,
    QualityControl,
    Packaging,
    Dispatch
}
enum BatchStatus {
    Created,
    InSpinning,
    InWeaving,
    InDyeing,
    InCutting,
    InStitching,
    InFinishing,
    QCPending,
    QCApproved,
    QCRejected,
    InPackaging,
    ReadyForDispatch,
    Dispatched,
    InTransit,
    DeliveredToOutlet,
    Recalled
}
enum DispatchType {
    InternalTransfer,
    OutboundShipment,
    ReturnShipment,
    RecallShipment
}
enum TransitStatus {
    NotStarted,
    Preparing,
    AwaitingConsensus,
    Dispatched,
    InTransit,
    ArrivedAtHub,
    OutForDelivery,
    Delivered,
    Failed,
    Returned
}
enum OutletType {
    PhysicalStore,
    OnlineStore,
    PopupStore,
    Wholesale
}

// ═══════════════════════════════════════════════════════════════════════════
//  GLOBAL STRUCTS
// ═══════════════════════════════════════════════════════════════════════════
struct Proposal {
    bytes32 proposalHash;
    uint256 approvals;
    uint256 createdAt;
    bool executed;
    mapping(address => bool) voted;
}

struct Actor {
    address wallet;
    ActorRole role;
    string name;
    string location;
    bool isActive;
    uint256 registeredAt;
    uint256 totalTransactions;
    uint256 reputationScore;
}

struct RawMaterial {
    uint256 materialId;
    FiberType fiberType;
    string originFarm;
    address suppliedBy;
    uint256 weightKg;
    uint256 pricePerKg;
    uint256 totalCost;
    QualityGrade grade;
    bool qualityApproved;
    address approvedBy;
    uint256 harvestDate;
    uint256 receivedAt;
    string certifications;
    bool isConsumed;
}

struct DepartmentRecord {
    Department dept;
    string deptName;
    address deptHead;
    bool isOperational;
    uint256 batchesProcessed;
}

struct ProductionBatch {
    uint256 batchId;
    string batchCode;
    string productName;
    string productDescription;
    FiberType primaryFiber;
    uint256[] rawMaterialIds;
    uint256 quantityUnits;
    uint256 totalWeightKg;
    uint256 rawMaterialCost;
    uint256 productionCost;
    uint256 finalCost;
    uint256 retailPrice;
    BatchStatus status;
    Department currentDept;
    address currentCustodian;
    bool isFinished;
    bool isRecalled;
    uint256 createdAt;
    uint256 lastUpdatedAt;
    string qcNotes;
    address qcInspector;
}

struct DeptProcessingLog {
    Department dept;
    address processedBy;
    uint256 enteredAt;
    uint256 exitedAt;
    uint256 costAdded;
    string notes;
    bool approved;
}

struct DispatchOrder {
    uint256 orderId;
    uint256 batchId;
    DispatchType dispatchType;
    address originCustodian;
    address destinationCustodian;
    string originLocation;
    string destinationLocation;
    string courierName;
    string trackingNumber;
    uint256 estimatedDelivery;
    uint256 actualDelivery;
    TransitStatus transitStatus;
    uint256 shippingCost;
    uint256 createdAt;
    uint256 dispatchedAt;
    bool originConfirmed;
    bool logisticsConfirmed;
    bool financeConfirmed;
    bool destinationConfirmed;
    address originSigner;
    address logisticsSigner;
    address financeSigner;
    address destinationSigner;
    string deliveryNotes;
}

struct TransitCheckpoint {
    uint256 orderId;
    string location;
    uint256 timestamp;
    string statusNote;
    address updatedBy;
}

struct RetailOutletProfile {
    address wallet;
    OutletType outletType;
    string storeName;
    string storeLocation;
    string platformURL;
    bool isVerified;
    uint256 totalReceived;
    uint256 totalReturned;
    uint256 registeredAt;
}

struct OwnershipRecord {
    address owner;
    string ownerName;
    uint256 transferredAt;
    string transferReason;
    BatchStatus statusAtTransfer;
}
