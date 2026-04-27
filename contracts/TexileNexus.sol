// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./TextileTypes.sol";
import "./TextileLogic.sol";

contract TextileNexusPro {
    // ═══════════════════════════════════════════════════════════════════════════
    //  CUSTOM ERRORS (Massive Bytecode Savings)
    // ═══════════════════════════════════════════════════════════════════════════
    error Unauthorized();
    error InvalidInput();
    error NotFound();
    error InvalidState();
    error AlreadyProcessed();
    error Expired();

    // ═══════════════════════════════════════════════════════════════════════════
    //  STATE VARIABLES & MAPPINGS
    // ═══════════════════════════════════════════════════════════════════════════
    address public admin;
    address[] public governanceCouncil;
    mapping(address => bool) public isCouncilMember;

    mapping(uint256 => Proposal) private proposals;
    uint256 public proposalCount;
    uint256 public constant PROPOSAL_TTL = 7 days;
    uint256 public governanceThreshold;

    mapping(address => Actor) public actors;
    address[] public actorIndex;

    mapping(uint256 => RawMaterial) public rawMaterials;
    uint256 public materialCount;

    mapping(Department => DepartmentRecord) public departments;
    bool public departmentsInitialized;



    mapping(uint256 => ProductionBatch) public batches;
    uint256 public batchCount;
    mapping(uint256 => DeptProcessingLog[]) public batchDeptLogs;

    mapping(uint256 => DispatchOrder) public dispatchOrders;
    uint256 public dispatchCount;
    mapping(uint256 => TransitCheckpoint[]) public transitCheckpoints;

    mapping(address => RetailOutletProfile) public retailProfiles;
    mapping(address => mapping(uint256 => uint256)) public outletInventory;

    mapping(uint256 => OwnershipRecord[]) public ownershipHistory;

    // ═══════════════════════════════════════════════════════════════════════════
    //  EVENTS (Main Contract)
    // ═══════════════════════════════════════════════════════════════════════════
    event ActorRegistered(address indexed wallet, ActorRole role, string name);
    event ActorDeactivated(address indexed wallet);
    event ActorReputationUpdated(address indexed wallet, uint256 newScore);
    event MaterialSourced(
        uint256 indexed materialId,
        address indexed supplier,
        FiberType fiber,
        uint256 weightKg,
        uint256 totalCost
    );
    event MaterialQualityApproved(
        uint256 indexed materialId,
        QualityGrade grade,
        address indexed inspector
    );
    event MaterialQualityRejected(
        uint256 indexed materialId,
        address indexed inspector,
        string reason
    );
    event BatchMovedToDept(
        uint256 indexed batchId,
        Department indexed dept,
        address indexed deptHead
    );
    event BatchDeptCompleted(
        uint256 indexed batchId,
        Department indexed dept,
        uint256 costAdded
    );
    event BatchQCApproved(
        uint256 indexed batchId,
        address indexed inspector,
        string notes
    );
    event BatchQCRejected(
        uint256 indexed batchId,
        address indexed inspector,
        string notes
    );
    event BatchReadyForDispatch(uint256 indexed batchId, uint256 finalCost);
    event BatchRecalled(uint256 indexed batchId, string reason);
    event DispatchConsensusUpdate(
        uint256 indexed orderId,
        string signer,
        address indexed signerAddress
    );
    event BatchDispatched(
        uint256 indexed orderId,
        uint256 indexed batchId,
        string courier,
        string trackingNo
    );
    event TransitCheckpointAdded(
        uint256 indexed orderId,
        string location,
        uint256 timestamp
    );
    event BatchDelivered(
        uint256 indexed orderId,
        uint256 indexed batchId,
        address indexed receiver
    );
    event DispatchFailed(uint256 indexed orderId, string reason);
    event OwnershipTransferred(
        uint256 indexed batchId,
        address indexed from,
        address indexed to,
        string reason
    );
    event PaymentReleased(
        uint256 indexed batchId,
        address indexed recipient,
        uint256 amount,
        string reason
    );

    // ═══════════════════════════════════════════════════════════════════════════
    //  MODIFIERS
    // ═══════════════════════════════════════════════════════════════════════════
    modifier onlyAdmin() {
        if (msg.sender != admin) revert Unauthorized();
        _;
    }

    modifier onlyCouncil() {
        if (!isCouncilMember[msg.sender] && msg.sender != admin)
            revert Unauthorized();
        _;
    }

    modifier onlyRole(ActorRole _role) {
        if (actors[msg.sender].role != _role || !actors[msg.sender].isActive)
            revert Unauthorized();
        _;
    }

    modifier onlySupplyChainActor() {
        if (
            actors[msg.sender].role == ActorRole.None ||
            !actors[msg.sender].isActive
        ) revert Unauthorized();
        _;
    }

    modifier materialExists(uint256 _id) {
        if (rawMaterials[_id].suppliedBy == address(0)) revert NotFound();
        _;
    }

    modifier batchExists(uint256 _id) {
        if (batches[_id].createdAt == 0) revert NotFound();
        _;
    }

    modifier dispatchExists(uint256 _id) {
        if (dispatchOrders[_id].createdAt == 0) revert NotFound();
        _;
    }

    modifier notRecalled(uint256 _batchId) {
        if (batches[_batchId].isRecalled) revert InvalidState();
        _;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  CONSTRUCTOR & INTERNAL
    // ═══════════════════════════════════════════════════════════════════════════
    constructor(address[] memory _council, uint256 _threshold) {
        if (_council.length < _threshold) revert InvalidInput();
        admin = msg.sender;
        governanceThreshold = _threshold;

        for (uint256 i = 0; i < _council.length; i++) {
            governanceCouncil.push(_council[i]);
            isCouncilMember[_council[i]] = true;
        }

        _registerActor(
            msg.sender,
            ActorRole.DepartmentHead,
            "Factory Admin",
            "HQ"
        );
        _initializeDepartments();
    }

    function _initializeDepartments() internal {
        string[10] memory names = [
            "Sourcing",
            "Spinning",
            "Weaving",
            "Dyeing",
            "Cutting",
            "Stitching",
            "Finishing",
            "Quality Control",
            "Packaging",
            "Dispatch"
        ];
        for (uint8 i = 0; i < 10; i++) {
            departments[Department(i)] = DepartmentRecord({
                dept: Department(i),
                deptName: names[i],
                deptHead: admin,
                isOperational: true,
                batchesProcessed: 0
            });
        }
        departmentsInitialized = true;
    }

    function _registerActor(
        address _wallet,
        ActorRole _role,
        string memory _name,
        string memory _location
    ) internal {
        actors[_wallet] = Actor({
            wallet: _wallet,
            role: _role,
            name: _name,
            location: _location,
            isActive: true,
            registeredAt: block.timestamp,
            totalTransactions: 0,
            reputationScore: 500
        });
        actorIndex.push(_wallet);
        emit ActorRegistered(_wallet, _role, _name);
    }

    function _recordOwnership(
        uint256 _batchId,
        address _newOwner,
        string memory _reason
    ) internal {
        string memory ownerName = actors[_newOwner].name;
        ownershipHistory[_batchId].push(
            OwnershipRecord({
                owner: _newOwner,
                ownerName: ownerName,
                transferredAt: block.timestamp,
                transferReason: _reason,
                statusAtTransfer: batches[_batchId].status
            })
        );

        address prevOwner = batches[_batchId].currentCustodian;
        batches[_batchId].currentCustodian = _newOwner;
        batches[_batchId].lastUpdatedAt = block.timestamp;

        emit OwnershipTransferred(_batchId, prevOwner, _newOwner, _reason);
    }

    function _incrementReputation(address _actor, uint256 _points) internal {
        uint256 current = actors[_actor].reputationScore;
        uint256 newScore = current + _points > 1000 ? 1000 : current + _points;
        actors[_actor].reputationScore = newScore;
        actors[_actor].totalTransactions++;
        emit ActorReputationUpdated(_actor, newScore);
    }

    function _decrementReputation(address _actor, uint256 _points) internal {
        uint256 current = actors[_actor].reputationScore;
        uint256 newScore = current < _points ? 0 : current - _points;
        actors[_actor].reputationScore = newScore;
        emit ActorReputationUpdated(_actor, newScore);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  CORE REGISTRATION & SOURCING
    // ═══════════════════════════════════════════════════════════════════════════
    function registerActor(
        address _wallet,
        ActorRole _role,
        string memory _name,
        string memory _location
    ) external onlyAdmin {
        if (_wallet == address(0)) revert InvalidInput();
        if (actors[_wallet].role != ActorRole.None) revert AlreadyProcessed();
        if (_role == ActorRole.None) revert InvalidInput();
        _registerActor(_wallet, _role, _name, _location);
    }

    function registerRetailOutlet(
        address _wallet,
        ActorRole _role,
        string memory _storeName,
        string memory _location,
        OutletType _outletType,
        string memory _platformURL
    ) external onlyAdmin {
        if (_role != ActorRole.RetailOutlet && _role != ActorRole.OnlineStore)
            revert Unauthorized();
        _registerActor(_wallet, _role, _storeName, _location);
        retailProfiles[_wallet] = RetailOutletProfile({
            wallet: _wallet,
            outletType: _outletType,
            storeName: _storeName,
            storeLocation: _location,
            platformURL: _platformURL,
            isVerified: true,
            totalReceived: 0,
            totalReturned: 0,
            registeredAt: block.timestamp
        });
    }

    function setDepartmentHead(
        Department _dept,
        address _head
    ) external onlyAdmin {
        if (actors[_head].role != ActorRole.DepartmentHead)
            revert Unauthorized();
        departments[_dept].deptHead = _head;
    }

    function deactivateActor(address _wallet) external onlyAdmin {
        actors[_wallet].isActive = false;
        emit ActorDeactivated(_wallet);
    }

    function sourceMaterial(
        FiberType _fiberType,
        string memory _originFarm,
        uint256 _weightKg,
        uint256 _pricePerKg,
        uint256 _harvestDate,
        string memory _certifications
    ) external returns (uint256 materialId) {
        ActorRole r = actors[msg.sender].role;
        if (r != ActorRole.Farmer && r != ActorRole.Vendor)
            revert Unauthorized();
        if (!actors[msg.sender].isActive) revert Unauthorized();
        if (_weightKg == 0 || _pricePerKg == 0) revert InvalidInput();

        materialId = ++materialCount;
        uint256 totalCost = _weightKg * _pricePerKg;

        rawMaterials[materialId] = RawMaterial({
            materialId: materialId,
            fiberType: _fiberType,
            originFarm: _originFarm,
            suppliedBy: msg.sender,
            weightKg: _weightKg,
            pricePerKg: _pricePerKg,
            totalCost: totalCost,
            grade: QualityGrade.Standard,
            qualityApproved: false,
            approvedBy: address(0),
            harvestDate: _harvestDate,
            receivedAt: block.timestamp,
            certifications: _certifications,
            isConsumed: false
        });

        _incrementReputation(msg.sender, 5);
        emit MaterialSourced(
            materialId,
            msg.sender,
            _fiberType,
            _weightKg,
            totalCost
        );
    }

    function approveMaterialQuality(
        uint256 _materialId,
        QualityGrade _grade
    )
        external
        onlyRole(ActorRole.QualityInspector)
        materialExists(_materialId)
    {
        RawMaterial storage mat = rawMaterials[_materialId];
        if (mat.qualityApproved) revert AlreadyProcessed();
        if (mat.isConsumed) revert InvalidState();
        if (_grade == QualityGrade.Rejected) revert InvalidInput();

        mat.grade = _grade;
        mat.qualityApproved = true;
        mat.approvedBy = msg.sender;

        _incrementReputation(msg.sender, 3);
        _incrementReputation(mat.suppliedBy, 10);
        emit MaterialQualityApproved(_materialId, _grade, msg.sender);
    }

    function rejectMaterialQuality(
        uint256 _materialId,
        string memory _reason
    )
        external
        onlyRole(ActorRole.QualityInspector)
        materialExists(_materialId)
    {
        RawMaterial storage mat = rawMaterials[_materialId];
        if (mat.qualityApproved) revert AlreadyProcessed();
        if (mat.isConsumed) revert InvalidState();

        mat.grade = QualityGrade.Rejected;
        mat.approvedBy = msg.sender;

        _decrementReputation(mat.suppliedBy, 20);
        _incrementReputation(msg.sender, 3);
        emit MaterialQualityRejected(_materialId, msg.sender, _reason);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  PRODUCTION BATCH & DISPATCH (ROUTED TO LIBRARY)
    // ═══════════════════════════════════════════════════════════════════════════
    function createBatch(
        TextileLogic.BatchParams calldata params
    ) external onlyRole(ActorRole.DepartmentHead) returns (uint256) {
        uint256 newBatchId = ++batchCount;
        TextileLogic.executeBatchCreation(
            batches,
            rawMaterials,
            newBatchId,
            params,
            msg.sender
        );

        _recordOwnership(newBatchId, msg.sender, "batch_created");
        departments[Department.Sourcing].batchesProcessed++;
        _incrementReputation(msg.sender, 5);

        return newBatchId;
    }

    function createDispatchOrder(
        TextileLogic.DispatchParams calldata params
    )
        external
        onlyRole(ActorRole.LogisticsAgent)
        batchExists(params.batchId)
        notRecalled(params.batchId)
        returns (uint256)
    {
        uint256 newOrderId = ++dispatchCount;
        TextileLogic.executeDispatch(
            dispatchOrders,
            batches,
            actors,
            retailProfiles,
            newOrderId,
            params
        );

        _incrementReputation(msg.sender, 3);
        return newOrderId;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  CONTINUATION OF LOGIC (Department Moves, Consensuses)
    // ═══════════════════════════════════════════════════════════════════════════
    function moveBatchToDepartment(
        uint256 _batchId,
        Department _targetDept,
        uint256 _costToAdd,
        string memory _notes
    )
        external
        onlyRole(ActorRole.DepartmentHead)
        batchExists(_batchId)
        notRecalled(_batchId)
    {
        ProductionBatch storage batch = batches[_batchId];
        if (
            batch.status == BatchStatus.Dispatched ||
            batch.status == BatchStatus.DeliveredToOutlet ||
            batch.status == BatchStatus.QCRejected
        ) revert InvalidState();

        Department current = batch.currentDept;
        
        // Prevent bypassing finalizeBatch
        if (_targetDept == Department.Dispatch) revert InvalidState();

        if (_targetDept != Department.QualityControl) {
            if (current == Department.QualityControl && _targetDept == Department.Packaging) {
                // Must be explicitly QC Approved to move to Packaging
                if (batch.status != BatchStatus.QCApproved) revert InvalidState();
            } else if (uint8(_targetDept) != uint8(current) + 1) {
                // Otherwise, must be strictly sequential
                revert InvalidState();
            }
        }

        DeptProcessingLog[] storage logs = batchDeptLogs[_batchId];
        if (logs.length > 0) {
            logs[logs.length - 1].exitedAt = block.timestamp;
            logs[logs.length - 1].costAdded = _costToAdd;
            logs[logs.length - 1].notes = _notes;
            logs[logs.length - 1].approved = true;
        }

        batchDeptLogs[_batchId].push(
            DeptProcessingLog({
                dept: _targetDept,
                processedBy: departments[_targetDept].deptHead,
                enteredAt: block.timestamp,
                exitedAt: 0,
                costAdded: 0,
                notes: "",
                approved: false
            })
        );

        batch.productionCost += _costToAdd;
        batch.finalCost = batch.rawMaterialCost + batch.productionCost;
        batch.currentDept = _targetDept;
        batch.lastUpdatedAt = block.timestamp;
        batch.status = _deptToStatus(_targetDept);

        address deptHead = departments[_targetDept].deptHead;
        _recordOwnership(
            _batchId,
            deptHead,
            string(
                abi.encodePacked(
                    "transferred_to_",
                    departments[_targetDept].deptName
                )
            )
        );
        departments[_targetDept].batchesProcessed++;
        _incrementReputation(msg.sender, 3);

        emit BatchMovedToDept(_batchId, _targetDept, deptHead);
        emit BatchDeptCompleted(_batchId, current, _costToAdd);
    }

    function _deptToStatus(
        Department _dept
    ) internal pure returns (BatchStatus) {
        if (_dept == Department.Spinning) return BatchStatus.InSpinning;
        if (_dept == Department.Weaving) return BatchStatus.InWeaving;
        if (_dept == Department.Dyeing) return BatchStatus.InDyeing;
        if (_dept == Department.Cutting) return BatchStatus.InCutting;
        if (_dept == Department.Stitching) return BatchStatus.InStitching;
        if (_dept == Department.Finishing) return BatchStatus.InFinishing;
        if (_dept == Department.QualityControl) return BatchStatus.QCPending;
        if (_dept == Department.Packaging) return BatchStatus.InPackaging;
        if (_dept == Department.Dispatch) return BatchStatus.ReadyForDispatch;
        return BatchStatus.Created;
    }

    function approveQC(
        uint256 _batchId,
        string memory _notes
    )
        external
        onlyRole(ActorRole.QualityInspector)
        batchExists(_batchId)
        notRecalled(_batchId)
    {
        ProductionBatch storage batch = batches[_batchId];
        if (batch.status != BatchStatus.QCPending) revert InvalidState();
        batch.status = BatchStatus.QCApproved;
        batch.qcNotes = _notes;
        batch.qcInspector = msg.sender;
        batch.lastUpdatedAt = block.timestamp;
        _incrementReputation(msg.sender, 5);
        emit BatchQCApproved(_batchId, msg.sender, _notes);
    }

    function rejectQC(
        uint256 _batchId,
        string memory _reason
    )
        external
        onlyRole(ActorRole.QualityInspector)
        batchExists(_batchId)
        notRecalled(_batchId)
    {
        ProductionBatch storage batch = batches[_batchId];
        if (batch.status != BatchStatus.QCPending) revert InvalidState();
        batch.status = BatchStatus.QCRejected;
        batch.qcNotes = _reason;
        batch.qcInspector = msg.sender;
        batch.lastUpdatedAt = block.timestamp;
        _decrementReputation(batch.currentCustodian, 10);
        _incrementReputation(msg.sender, 5);
        emit BatchQCRejected(_batchId, msg.sender, _reason);
    }

    function resubmitAfterQCRejection(
        uint256 _batchId,
        string memory _remediationNotes
    )
        external
        onlyRole(ActorRole.DepartmentHead)
        batchExists(_batchId)
        notRecalled(_batchId)
    {
        ProductionBatch storage batch = batches[_batchId];
        if (batch.status != BatchStatus.QCRejected) revert InvalidState();
        batch.status = BatchStatus.QCPending;
        batch.currentDept = Department.QualityControl;
        batch.lastUpdatedAt = block.timestamp;
        batchDeptLogs[_batchId].push(
            DeptProcessingLog({
                dept: Department.QualityControl,
                processedBy: msg.sender,
                enteredAt: block.timestamp,
                exitedAt: 0,
                costAdded: 0,
                notes: string(
                    abi.encodePacked("Resubmitted: ", _remediationNotes)
                ),
                approved: false
            })
        );
        emit BatchMovedToDept(_batchId, Department.QualityControl, msg.sender);
    }

    function markReadyForDispatch(
        uint256 _batchId,
        uint256 _finalRetailPrice
    )
        external
        onlyRole(ActorRole.DepartmentHead)
        batchExists(_batchId)
        notRecalled(_batchId)
    {
        ProductionBatch storage batch = batches[_batchId];
        if (
            batch.status != BatchStatus.InPackaging &&
            batch.status != BatchStatus.QCApproved
        ) revert InvalidState();
        batch.status = BatchStatus.ReadyForDispatch;
        batch.currentDept = Department.Dispatch;
        batch.isFinished = true;
        batch.retailPrice = _finalRetailPrice;
        batch.lastUpdatedAt = block.timestamp;
        _incrementReputation(msg.sender, 5);
        emit BatchReadyForDispatch(_batchId, batch.finalCost);
    }

    function confirmDispatch_Origin(
        uint256 _orderId
    ) external onlyRole(ActorRole.DepartmentHead) dispatchExists(_orderId) {
        DispatchOrder storage order = dispatchOrders[_orderId];
        if (order.originConfirmed) revert AlreadyProcessed();
        if (
            order.originCustodian != msg.sender &&
            actors[msg.sender].role != ActorRole.DepartmentHead
        ) revert Unauthorized();

        order.originConfirmed = true;
        order.originSigner = msg.sender;
        order.transitStatus = TransitStatus.AwaitingConsensus;
        _incrementReputation(msg.sender, 2);
        emit DispatchConsensusUpdate(_orderId, "origin", msg.sender);
        _tryExecuteDispatch(_orderId);
    }

    function confirmDispatch_Logistics(
        uint256 _orderId,
        string memory _trackingNumber
    ) external onlyRole(ActorRole.LogisticsAgent) dispatchExists(_orderId) {
        DispatchOrder storage order = dispatchOrders[_orderId];
        if (order.logisticsConfirmed) revert AlreadyProcessed();

        order.logisticsConfirmed = true;
        order.logisticsSigner = msg.sender;
        order.trackingNumber = _trackingNumber;
        _incrementReputation(msg.sender, 2);
        emit DispatchConsensusUpdate(_orderId, "logistics", msg.sender);
        _tryExecuteDispatch(_orderId);
    }

    function confirmDispatch_Finance(
        uint256 _orderId
    ) external onlyRole(ActorRole.FinanceOfficer) dispatchExists(_orderId) {
        DispatchOrder storage order = dispatchOrders[_orderId];
        if (order.financeConfirmed) revert AlreadyProcessed();

        order.financeConfirmed = true;
        order.financeSigner = msg.sender;
        _incrementReputation(msg.sender, 2);
        emit DispatchConsensusUpdate(_orderId, "finance", msg.sender);
        _tryExecuteDispatch(_orderId);
    }

    function _tryExecuteDispatch(uint256 _orderId) internal {
        DispatchOrder storage order = dispatchOrders[_orderId];
        if (
            order.originConfirmed &&
            order.logisticsConfirmed &&
            order.financeConfirmed
        ) {
            order.transitStatus = TransitStatus.Dispatched;
            order.dispatchedAt = block.timestamp;
            ProductionBatch storage batch = batches[order.batchId];
            batch.status = BatchStatus.Dispatched;
            batch.lastUpdatedAt = block.timestamp;
            transitCheckpoints[_orderId].push(
                TransitCheckpoint({
                    orderId: _orderId,
                    location: order.originLocation,
                    timestamp: block.timestamp,
                    statusNote: "Departed from origin",
                    updatedBy: msg.sender
                })
            );
            emit BatchDispatched(
                _orderId,
                order.batchId,
                order.courierName,
                order.trackingNumber
            );
        }
    }

    function addTransitCheckpoint(
        uint256 _orderId,
        string memory _location,
        TransitStatus _newStatus,
        string memory _statusNote
    ) external onlyRole(ActorRole.LogisticsAgent) dispatchExists(_orderId) {
        DispatchOrder storage order = dispatchOrders[_orderId];
        if (
            order.transitStatus != TransitStatus.Dispatched &&
            order.transitStatus != TransitStatus.InTransit &&
            order.transitStatus != TransitStatus.ArrivedAtHub &&
            order.transitStatus != TransitStatus.OutForDelivery
        ) revert InvalidState();
        if (_newStatus == TransitStatus.Delivered) revert InvalidInput();

        transitCheckpoints[_orderId].push(
            TransitCheckpoint({
                orderId: _orderId,
                location: _location,
                timestamp: block.timestamp,
                statusNote: _statusNote,
                updatedBy: msg.sender
            })
        );
        order.transitStatus = _newStatus;
        ProductionBatch storage batch = batches[order.batchId];
        if (batch.status == BatchStatus.Dispatched) {
            batch.status = BatchStatus.InTransit;
        }
        batch.lastUpdatedAt = block.timestamp;
        _incrementReputation(msg.sender, 1);
        emit TransitCheckpointAdded(_orderId, _location, block.timestamp);
    }

    function markDispatchFailed(
        uint256 _orderId,
        string memory _reason
    ) external onlyRole(ActorRole.LogisticsAgent) dispatchExists(_orderId) {
        DispatchOrder storage order = dispatchOrders[_orderId];
        if (
            order.transitStatus != TransitStatus.InTransit &&
            order.transitStatus != TransitStatus.ArrivedAtHub
        ) revert InvalidState();

        order.transitStatus = TransitStatus.Failed;
        order.deliveryNotes = _reason;
        batches[order.batchId].status = BatchStatus.ReadyForDispatch;
        batches[order.batchId].lastUpdatedAt = block.timestamp;
        _decrementReputation(msg.sender, 15);
        emit DispatchFailed(_orderId, _reason);
    }

    function confirmReceipt(
        uint256 _orderId,
        string memory _deliveryNotes
    ) external dispatchExists(_orderId) {
        DispatchOrder storage order = dispatchOrders[_orderId];
        ActorRole r = actors[msg.sender].role;

        if (
            r != ActorRole.RetailOutlet &&
            r != ActorRole.OnlineStore &&
            r != ActorRole.DepartmentHead
        ) revert Unauthorized();
        if (order.destinationCustodian != msg.sender) revert Unauthorized();
        if (order.destinationConfirmed) revert AlreadyProcessed();
        if (
            order.transitStatus != TransitStatus.Dispatched &&
            order.transitStatus != TransitStatus.InTransit &&
            order.transitStatus != TransitStatus.ArrivedAtHub &&
            order.transitStatus != TransitStatus.OutForDelivery
        ) revert InvalidState();

        order.destinationConfirmed = true;
        order.destinationSigner = msg.sender;
        order.transitStatus = TransitStatus.Delivered;
        order.actualDelivery = block.timestamp;
        order.deliveryNotes = _deliveryNotes;

        ProductionBatch storage batch = batches[order.batchId];
        batch.status = BatchStatus.DeliveredToOutlet;
        batch.lastUpdatedAt = block.timestamp;

        _recordOwnership(order.batchId, msg.sender, "delivered_to_outlet");
        outletInventory[msg.sender][order.batchId] += batch.quantityUnits;

        if (retailProfiles[msg.sender].wallet != address(0)) {
            retailProfiles[msg.sender].totalReceived++;
        }

        _incrementReputation(msg.sender, 10);
        _incrementReputation(order.logisticsSigner, 5);
        emit BatchDelivered(_orderId, order.batchId, msg.sender);
    }

    function initiateRecall(
        uint256 _batchId,
        string memory _reason
    ) external onlyAdmin batchExists(_batchId) {
        ProductionBatch storage batch = batches[_batchId];
        if (batch.isRecalled) revert AlreadyProcessed();
        batch.isRecalled = true;
        batch.status = BatchStatus.Recalled;
        batch.lastUpdatedAt = block.timestamp;
        emit BatchRecalled(_batchId, _reason);
    }

    function proposeGovernanceAction(
        bytes32 _proposalHash
    ) external onlyCouncil returns (uint256 pid) {
        pid = ++proposalCount;
        Proposal storage p = proposals[pid];
        p.proposalHash = _proposalHash;
        p.approvals = 1;
        p.createdAt = block.timestamp;
        p.executed = false;
        p.voted[msg.sender] = true;
    }

    function approveProposal(uint256 _pid) external onlyCouncil {
        Proposal storage p = proposals[_pid];
        if (p.executed) revert AlreadyProcessed();
        if (p.voted[msg.sender]) revert AlreadyProcessed();
        if (block.timestamp > p.createdAt + PROPOSAL_TTL) revert Expired();

        p.voted[msg.sender] = true;
        p.approvals++;
    }

    function isProposalApproved(uint256 _pid) external view returns (bool) {
        return proposals[_pid].approvals >= governanceThreshold;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    //  VIEW FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════
    function getBatchOwnershipHistory(
        uint256 _batchId
    ) external view batchExists(_batchId) returns (OwnershipRecord[] memory) {
        return ownershipHistory[_batchId];
    }
    function getBatchDeptLogs(
        uint256 _batchId
    ) external view batchExists(_batchId) returns (DeptProcessingLog[] memory) {
        return batchDeptLogs[_batchId];
    }
    function getTransitCheckpoints(
        uint256 _orderId
    )
        external
        view
        dispatchExists(_orderId)
        returns (TransitCheckpoint[] memory)
    {
        return transitCheckpoints[_orderId];
    }
    function getBatchMaterials(
        uint256 _batchId
    ) external view batchExists(_batchId) returns (uint256[] memory) {
        return batches[_batchId].rawMaterialIds;
    }
    function getDispatchConsensus(
        uint256 _orderId
    )
        external
        view
        dispatchExists(_orderId)
        returns (
            bool origin,
            bool logistics,
            bool finance,
            bool destination,
            bool fullyConfirmed
        )
    {
        DispatchOrder storage o = dispatchOrders[_orderId];
        return (
            o.originConfirmed,
            o.logisticsConfirmed,
            o.financeConfirmed,
            o.destinationConfirmed,
            o.originConfirmed && o.logisticsConfirmed && o.financeConfirmed
        );
    }
    function getDispatchSigners(
        uint256 _orderId
    )
        external
        view
        dispatchExists(_orderId)
        returns (
            address originSigner,
            address logisticsSigner,
            address financeSigner,
            address destinationSigner
        )
    {
        DispatchOrder storage o = dispatchOrders[_orderId];
        return (
            o.originSigner,
            o.logisticsSigner,
            o.financeSigner,
            o.destinationSigner
        );
    }
    function getBatchCostBreakdown(
        uint256 _batchId
    )
        external
        view
        batchExists(_batchId)
        returns (
            uint256 rawMaterialCost,
            uint256 productionCost,
            uint256 finalCost,
            uint256 retailPrice,
            uint256 margin
        )
    {
        ProductionBatch storage b = batches[_batchId];
        return (
            b.rawMaterialCost,
            b.productionCost,
            b.finalCost,
            b.retailPrice,
            b.retailPrice > b.finalCost ? b.retailPrice - b.finalCost : 0
        );
    }
    function getActorCount() external view returns (uint256) {
        return actorIndex.length;
    }
    function getCouncilSize() external view returns (uint256) {
        return governanceCouncil.length;
    }
    function hasRole(
        address _wallet,
        ActorRole _role
    ) external view returns (bool) {
        return actors[_wallet].role == _role && actors[_wallet].isActive;
    }
    function getOutletInventory(
        address _outlet,
        uint256 _batchId
    ) external view returns (uint256) {
        return outletInventory[_outlet][_batchId];
    }
}
