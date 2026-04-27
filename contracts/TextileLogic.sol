// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./TextileTypes.sol";

library TextileLogic {
    
    // Events needed within the library
    event MaterialConsumed(uint256 indexed materialId, uint256 indexed batchId);
    event BatchCreated(uint256 indexed batchId, string batchCode, string productName);
    event DispatchOrderCreated(uint256 indexed orderId, uint256 indexed batchId, DispatchType dispatchType);

    // Params struct prevents the "Stack too deep" error
    struct BatchParams {
        string batchCode;
        string productName;
        string productDescription;
        uint256[] rawMaterialIds;
        uint256 quantityUnits;
        uint256 retailPrice;
    }

    // Params struct prevents the "Stack too deep" error
    struct DispatchParams {
        uint256 batchId;
        address destinationCustodian;
        DispatchType dispatchType;
        string originLocation;
        string destinationLocation;
        string courierName;
        uint256 estimatedDelivery;
        uint256 shippingCost;
    }

    function executeBatchCreation(
        mapping(uint256 => ProductionBatch) storage batches,
        mapping(uint256 => RawMaterial) storage rawMaterials,
        uint256 batchId,
        BatchParams calldata params,
        address creator
    ) external {
        require(params.rawMaterialIds.length > 0, "Batch: No materials provided");
        require(params.quantityUnits > 0, "Batch: Quantity must be > 0");

        uint256 totalRawCost = 0;
        uint256 totalWeight = 0;
        FiberType primaryFiber = rawMaterials[params.rawMaterialIds[0]].fiberType;

        for (uint256 i = 0; i < params.rawMaterialIds.length; i++) {
            uint256 mid = params.rawMaterialIds[i];
            RawMaterial storage mat = rawMaterials[mid];
            require(mat.suppliedBy != address(0), "Batch: Material does not exist");
            require(mat.qualityApproved, "Batch: Material not QC approved");
            require(mat.grade != QualityGrade.Rejected, "Batch: Rejected material");
            require(!mat.isConsumed, "Batch: Material already consumed");

            totalRawCost += mat.totalCost;
            totalWeight += mat.weightKg;
            mat.isConsumed = true;
            emit MaterialConsumed(mid, batchId);
        }

        batches[batchId] = ProductionBatch({
            batchId: batchId,
            batchCode: params.batchCode,
            productName: params.productName,
            productDescription: params.productDescription,
            primaryFiber: primaryFiber,
            rawMaterialIds: params.rawMaterialIds,
            quantityUnits: params.quantityUnits,
            totalWeightKg: totalWeight,
            rawMaterialCost: totalRawCost,
            productionCost: 0,
            finalCost: totalRawCost,
            retailPrice: params.retailPrice,
            status: BatchStatus.Created,
            currentDept: Department.Sourcing,
            currentCustodian: creator,
            isFinished: false,
            isRecalled: false,
            createdAt: block.timestamp,
            lastUpdatedAt: block.timestamp,
            qcNotes: "",
            qcInspector: address(0)
        });

        emit BatchCreated(batchId, params.batchCode, params.productName);
    }

    function executeDispatch(
        mapping(uint256 => DispatchOrder) storage dispatchOrders,
        mapping(uint256 => ProductionBatch) storage batches,
        mapping(address => Actor) storage actors,
        mapping(address => RetailOutletProfile) storage retailProfiles,
        uint256 orderId,
        DispatchParams calldata params
    ) external {
        ProductionBatch storage batch = batches[params.batchId];
        require(
            batch.status == BatchStatus.ReadyForDispatch ||
            batch.status == BatchStatus.Recalled,
            "Dispatch: Batch not ready"
        );
        require(params.destinationCustodian != address(0), "Dispatch: Invalid destination");
        require(actors[params.destinationCustodian].isActive || 
                retailProfiles[params.destinationCustodian].isVerified,
                "Dispatch: Destination not registered");

        dispatchOrders[orderId] = DispatchOrder({
            orderId: orderId,
            batchId: params.batchId,
            dispatchType: params.dispatchType,
            originCustodian: batch.currentCustodian,
            destinationCustodian: params.destinationCustodian,
            originLocation: params.originLocation,
            destinationLocation: params.destinationLocation,
            courierName: params.courierName,
            trackingNumber: "",
            estimatedDelivery: params.estimatedDelivery,
            actualDelivery: 0,
            transitStatus: TransitStatus.Preparing,
            shippingCost: params.shippingCost,
            createdAt: block.timestamp,
            dispatchedAt: 0,
            originConfirmed: false,
            logisticsConfirmed: false,
            financeConfirmed: false,
            destinationConfirmed: false,
            originSigner: address(0),
            logisticsSigner: address(0),
            financeSigner: address(0),
            destinationSigner: address(0),
            deliveryNotes: ""
        });

        batch.lastUpdatedAt = block.timestamp;

        emit DispatchOrderCreated(orderId, params.batchId, params.dispatchType);
    }
}