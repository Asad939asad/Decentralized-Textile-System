import React, { useState, useEffect } from 'react';
import { getAddress } from 'viem';
import { useWeb3 } from '../src/context/Web3Context';
import { ActorRole, FiberType, QualityGrade, BatchStatus, Department } from '../../backend/contractBridge';
import { containerStyle, titleStyle, gridStyle, cardStyle, cardTitleStyle, inputGroup, labelStyle, inputStyle, btnStyle } from './Admin';

export default function Analytics() {
  const { bridge } = useWeb3();

  // Helper to nicely render objects
  const RenderObject = ({ data }: { data: any }) => {
    if (!data) return <span>...</span>;
    if (typeof data !== 'object') return <span>{data.toString()}</span>;
    
    if (Array.isArray(data)) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {data.map((item, idx) => (
            <div key={idx} style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
              <RenderObject data={item} />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {Object.entries(data).map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '2px' }}>
            <span style={{ opacity: 0.7, marginRight: '10px' }}>{k}:</span>
            <span style={{ fontWeight: 'bold', textAlign: 'right', wordBreak: 'break-all' }}>
              {typeof v === 'bigint' ? v.toString() : (typeof v === 'object' ? JSON.stringify(v) : String(v))}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // Global Stats
  const [actorCount, setActorCount] = useState<string>('-');
  const [councilSize, setCouncilSize] = useState<string>('-');
  const [totalBatches, setTotalBatches] = useState<string>('-');
  const [companyEarnings, setCompanyEarnings] = useState<string>('-');

  // Active Production State
  const [activeBatches, setActiveBatches] = useState<any[]>([]);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [availableMaterials, setAvailableMaterials] = useState<any[]>([]);

  useEffect(() => {
    if (bridge) {
      bridge.getActorCount().then(c => setActorCount(c.toString())).catch(console.error);
      bridge.getCouncilSize().then(c => setCouncilSize(c.toString())).catch(console.error);

      // Compute total delivered batches and total company net earnings
      bridge.batchCount().then(async (c) => {
        setTotalBatches(c.toString());
        let earnings = 0n;
        for (let i = 1n; i <= c; i++) {
          const b = await bridge.batches(i) as any;
          // b[11] is a bigint from viem — must compare with 14n (DeliveredToOutlet)
          const status = BigInt(b[11]);
          if (status === 14n) {
            const retail = BigInt(b[10]); // retailPrice
            const cost   = BigInt(b[9]);  // finalCost
            earnings += retail - cost;    // show actual value even if negative
          }
        }
        setCompanyEarnings(earnings.toString());
      }).catch(console.error);
      
      // Fetch Active Batches
      bridge.batchCount().then(async (c) => {
        const active = [];
        for (let i = 1n; i <= c; i++) {
          const b = await bridge.batches(i) as any;
          // Status < 11 (ReadyForDispatch) means in production. Exclude Recalled.
          if (b[11] < 11 && !b[15]) {
            const deptHead = await bridge.departments(b[12]).then((d: any) => d[2]).catch(() => 'Unknown');
            active.push({
              'Batch ID': b[0]?.toString(),
              'Product': b[2],
              'Department': Object.keys(Department).find(k => Department[k as any] === b[12]) || b[12],
              'Status': Object.keys(BatchStatus).find(k => BatchStatus[k as any] === b[11]) || b[11],
              'Dept Head Wallet': deptHead
            });
          }
        }
        setActiveBatches(active);
      }).catch(console.error);

      // Fetch Pending Orders
      bridge.dispatchCount().then(async (c) => {
        const pending = [];
        for (let i = 1n; i <= c; i++) {
          const o = await bridge.dispatchOrders(i) as any;
          const con = await bridge.getDispatchConsensus(i) as any;
          if (!con[3]) { // not fully confirmed
            pending.push({
              'Order ID': o[0]?.toString(),
              'Batch ID': o[1]?.toString(),
              'Origin Confirmed': con[0] ? 'Yes' : 'No',
              'Logistics Confirmed': con[1] ? 'Yes' : 'No',
              'Finance Confirmed': con[2] ? 'Yes' : 'No'
            });
          }
        }
        setPendingOrders(pending);
      }).catch(console.error);

      // Fetch Available Materials for Sourcing
      bridge.materialCount().then(async (c) => {
        const available = [];
        for (let i = 1n; i <= c; i++) {
          const m = await bridge.rawMaterials(i) as any;
          if (!m[13]) { // not consumed
            available.push({
              'Fiber Type': Object.keys(FiberType).find(k => FiberType[k as any] === m[1]) || m[1],
              'Total Cost': m[6]?.toString(),
              'Premium': Object.keys(QualityGrade).find(k => QualityGrade[k as any] === m[7]) || m[7],
              'Certifications': m[12],
              'Is Consumed': m[13] ? 'Yes' : 'No'
            });
          }
        }
        setAvailableMaterials(available);
      }).catch(console.error);
    }
  }, [bridge]);

  // Form States & Results
  const [batchId, setBatchId] = useState('');
  const [batchDetails, setBatchDetails] = useState<any>(null);
  const [batchHistory, setBatchHistory] = useState<any>(null);
  const [batchLogs, setBatchLogs] = useState<any>(null);
  const [batchMats, setBatchMats] = useState<any>(null);
  const [batchCost, setBatchCost] = useState<any>(null);

  const [orderId, setOrderId] = useState('');
  const [transitChecks, setTransitChecks] = useState<any>(null);
  const [dispatchCon, setDispatchCon] = useState<any>(null);
  const [dispatchSig, setDispatchSig] = useState<any>(null);

  const [hrWallet, setHrWallet] = useState('');
  const [hrResult, setHrResult] = useState<any>(null);

  const [oiOutlet, setOiOutlet] = useState('');
  const [oiBatch, setOiBatch] = useState('');
  const [oiResult, setOiResult] = useState<any>(null);

  const [paId, setPaId] = useState('');
  const [paResult, setPaResult] = useState<string>('');

  const [matSearchType, setMatSearchType] = useState<'ID' | 'Farmer'>('ID');
  const [matSearchValue, setMatSearchValue] = useState('');
  const [matResult, setMatResult] = useState<any>(null);

  const fetchBatchData = async () => {
    if (!bridge || !batchId) return;
    const id = BigInt(batchId);
    try {
      setBatchDetails('Fetching details...');
      
      const rawBatch = await bridge.batches(id) as any;
      setBatchDetails({
        'Batch ID': rawBatch[0]?.toString(),
        'Batch Code': rawBatch[1],
        'Product': rawBatch[2],
        'Description': rawBatch[3],
        'Primary Fiber': Object.keys(FiberType).find(k => FiberType[k as any] === rawBatch[4]) || rawBatch[4],
        'Quantity': rawBatch[5]?.toString(),
        'Weight (Kg)': rawBatch[6]?.toString(),
        'Status': Object.keys(BatchStatus).find(k => BatchStatus[k as any] === rawBatch[11]) || rawBatch[11],
        'Current Dept': Object.keys(Department).find(k => Department[k as any] === rawBatch[12]) || rawBatch[12],
        'Custodian': rawBatch[13],
        'Finished?': rawBatch[14] ? 'Yes' : 'No',
        'Created At': new Date(Number(rawBatch[16]) * 1000).toLocaleString(),
        'QC Notes': rawBatch[18] || 'None'
      });

      const history = await bridge.getBatchOwnershipHistory(id) as any[];
      setBatchHistory(history.map(h => ({
        'Owner': h.owner,
        'Name': h.ownerName,
        'Transferred': new Date(Number(h.transferredAt) * 1000).toLocaleString(),
        'Reason': h.transferReason,
        'Status At Transfer': Object.keys(BatchStatus).find(k => BatchStatus[k as any] === h.statusAtTransfer) || h.statusAtTransfer
      })));

      const logs = await bridge.getBatchDeptLogs(id) as any[];
      setBatchLogs(logs.map(l => ({
        'Department': Object.keys(Department).find(k => Department[k as any] === l.dept) || l.dept,
        'Processed By': l.processedBy,
        'Entered': new Date(Number(l.enteredAt) * 1000).toLocaleString(),
        'Exited': l.exitedAt == 0 ? 'In Progress' : new Date(Number(l.exitedAt) * 1000).toLocaleString(),
        'Cost Added': l.costAdded?.toString(),
        'Notes': l.notes || 'None',
        'Approved': l.approved ? 'Yes' : 'No'
      })));

      const matIds = await bridge.getBatchMaterials(id) as bigint[];
      const mats = [];
      for (const mId of matIds) {
        mats.push(parseMaterial(await bridge.rawMaterials(mId)));
      }
      setBatchMats(mats);

      const cost = await bridge.getBatchCostBreakdown(id) as any;
      setBatchCost({
        'Raw Material Cost': cost[0]?.toString(),
        'Production Cost': cost[1]?.toString(),
        'Total Cost': cost[2]?.toString(),
        'Retail Price': cost[3]?.toString(),
        'Margin': cost[4]?.toString()
      });

      // Find the latest movement note
      const latestNote = logs.length > 0 ? logs.filter(l => l.notes && l.notes !== "").pop()?.notes : 'None';
      setBatchDetails((prev: any) => ({ ...prev, 'Latest Movement Note': latestNote || 'None' }));

    } catch (e: any) { 
      setBatchDetails('Error fetching batch.');
      alert(e.message); 
    }
  };

  const fetchOrderData = async () => {
    if (!bridge || !orderId) return;
    const id = BigInt(orderId);
    try {
      const transit = await bridge.getTransitCheckpoints(id) as any[];
      setTransitChecks(transit.map(t => ({
        'Handler': t.updatedBy, // Note: the ABI says orderId, location, timestamp, statusNote, updatedBy
        'Location': t.location,
        'Timestamp': new Date(Number(t.timestamp) * 1000).toLocaleString(),
        'Notes': t.statusNote
      })));

      const con = await bridge.getDispatchConsensus(id) as any;
      setDispatchCon({
        'DepartmentHead Approved': con[0] ? 'Yes' : 'No',
        'Logistics Approved': con[1] ? 'Yes' : 'No',
        'Finance Approved': con[2] ? 'Yes' : 'No',
        'Is Finalized': con[3] ? 'Yes' : 'No'
      });

      const sig = await bridge.getDispatchSigners(id) as any;
      setDispatchSig({
        'Vendor': sig[0],
        'Logistics': sig[1],
        'Finance': sig[2]
      });
    } catch (e: any) { alert(e.message); }
  };

  const fetchActorData = async () => {
    if (!bridge || !hrWallet) return;
    try {
      setHrResult('Searching...');
      const res = await bridge.actors(hrWallet as any) as any;
      if (res && res[4]) {
        const roleName = Object.keys(ActorRole).find(key => ActorRole[key as keyof typeof ActorRole] === res[1]) || res[1];
        setHrResult({
          'Wallet': res[0],
          'Role': roleName,
          'Name': res[2],
          'Location': res[3],
          'Status': res[4] ? 'Active' : 'Inactive',
          'Registered At': new Date(Number(res[5]) * 1000).toLocaleString(),
          'Total Transactions': res[6].toString(),
          'Reputation Score': res[7].toString() + ' ★'
        });
      } else {
        setHrResult('Actor not found or inactive.');
      }
    } catch (e: any) { 
      setHrResult('Error fetching actor data.');
      alert(e.message); 
    }
  };

  const checkInventory = async () => {
    if (!bridge || !oiOutlet || !oiBatch) return;
    try {
      // Auto-checksum the address so viem doesn't reject lowercase input
      const checksummedOutlet = getAddress(oiOutlet);
      const batchId = BigInt(oiBatch);

      const units = await bridge.getOutletInventory(checksummedOutlet, batchId);
      const rawBatch = await bridge.batches(batchId) as any;

      // Correct indices from bridge.ts:
      // [5]=quantityUnits [7]=rawMaterialCost [8]=productionCost [9]=finalCost [10]=retailPrice
      const totalQty     = rawBatch[5] as bigint;
      const finalCost    = rawBatch[9] as bigint;   // total batch final cost
      const retailPrice  = rawBatch[10] as bigint;  // total batch retail price

      const finalCostPerUnit   = totalQty > 0n ? finalCost   / totalQty : 0n;
      const retailPricePerUnit = totalQty > 0n ? retailPrice / totalQty : 0n;

      const stockFinalCost    = finalCostPerUnit   * units;
      const stockRetailValue  = retailPricePerUnit * units;
      const netEarnings       = stockRetailValue > stockFinalCost ? stockRetailValue - stockFinalCost : 0n;

      setOiResult({
        'Product':                  rawBatch[2],
        'Batch Code':               rawBatch[1],
        'Units in Stock':           units.toString(),
        'Delivery Status':          Object.keys(BatchStatus).find(k => BatchStatus[k as any] === rawBatch[11]) || rawBatch[11],
        '──────────────':           '──────────────',
        'Retail Price (Per Unit)':  retailPricePerUnit.toString(),
        'Final Cost (Per Unit)':    finalCostPerUnit.toString(),
        'Total Stock Retail Value': stockRetailValue.toString(),
        'Total Stock Cost':         stockFinalCost.toString(),
        '💰 Net Earnings':          netEarnings.toString(),
      });
    } catch (e: any) { alert('Error: ' + e.shortMessage || e.message); }
  };

  const checkProposal = async () => {
    if (!bridge || !paId) return;
    try {
      const res = await bridge.isProposalApproved(BigInt(paId));
      setPaResult(res ? 'Approved' : 'Not Approved');
    } catch (e: any) { alert(e.message); }
  };

  const parseMaterial = (res: any) => ({
    'Material ID': res[0]?.toString(),
    'Fiber Type': Object.keys(FiberType).find(k => FiberType[k as any] === res[1]) || res[1],
    'Origin Farm': res[2],
    'Supplied By': res[3],
    'Weight (Kg)': res[4]?.toString(),
    'Price/Kg': res[5]?.toString(),
    'Total Cost': res[6]?.toString(),
    'Quality Grade': Object.keys(QualityGrade).find(k => QualityGrade[k as any] === res[7]) || res[7],
    'QC Approved': res[8] ? 'Yes' : 'No',
    'Approved By': res[9] === '0x0000000000000000000000000000000000000000' ? 'None' : res[9],
    'Harvest Date': new Date(Number(res[10]) * 1000).toLocaleString(),
    'Received At': new Date(Number(res[11]) * 1000).toLocaleString(),
    'Certifications': res[12],
    'Is Consumed': res[13] ? 'Yes' : 'No'
  });

  const fetchMaterialData = async () => {
    if (!bridge || !matSearchValue) return;
    try {
      setMatResult('Searching...');
      if (matSearchType === 'ID') {
        const res = await bridge.rawMaterials(BigInt(matSearchValue));
        setMatResult([parseMaterial(res)]);
      } else {
        const count = await bridge.materialCount();
        const results = [];
        for (let i = 1n; i <= count; i++) {
          const res = await bridge.rawMaterials(i);
          if (res[3]?.toLowerCase() === matSearchValue.toLowerCase()) {
            results.push(parseMaterial(res));
          }
        }
        setMatResult(results.length > 0 ? results : 'No materials found for this farmer.');
      }
    } catch (e: any) { 
      setMatResult('Error fetching materials.');
      alert(e.message); 
    }
  };

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>System Analytics</h1>
      {!bridge && <p style={{ textAlign: 'center', color: '#ffaaaa' }}>Please connect wallet to view analytics.</p>}

      {/* Global Stats Banner */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', margin: '2rem 0', flexWrap: 'wrap' }}>
        <div style={{...cardStyle, minWidth: '200px', textAlign: 'center'}}>
          <h3 style={{ margin: 0, color: 'rgba(255,255,255,0.7)' }}>Total Actors</h3>
          <p style={{ fontSize: '2.5rem', margin: '10px 0 0 0', fontWeight: 'bold' }}>{actorCount}</p>
        </div>
        <div style={{...cardStyle, minWidth: '200px', textAlign: 'center'}}>
          <h3 style={{ margin: 0, color: 'rgba(255,255,255,0.7)' }}>Council Size</h3>
          <p style={{ fontSize: '2.5rem', margin: '10px 0 0 0', fontWeight: 'bold' }}>{councilSize}</p>
        </div>
        <div style={{...cardStyle, minWidth: '200px', textAlign: 'center'}}>
          <h3 style={{ margin: 0, color: 'rgba(255,255,255,0.7)' }}>Total Batches</h3>
          <p style={{ fontSize: '2.5rem', margin: '10px 0 0 0', fontWeight: 'bold' }}>{totalBatches}</p>
        </div>
        <div style={{...cardStyle, minWidth: '220px', textAlign: 'center', border: '1px solid rgba(255, 215, 0, 0.4)', boxShadow: '0 0 24px rgba(255,215,0,0.15)'}}>
          <h3 style={{ margin: 0, color: '#e2dfd0ff' }}>Company Net Earnings</h3>
          <p style={{ fontSize: '2rem', margin: '10px 0 0 0', fontWeight: 'bold', color: '#ebeae4ff' }}>{companyEarnings === '-' ? '-' : companyEarnings}</p>
          <p style={{ fontSize: '0.75rem', margin: '4px 0 0 0', color: 'rgba(238, 236, 223, 0.6)' }}>Revenue − Production Cost (Delivered Batches)</p>
        </div>
      </div>

      <div style={gridStyle}>
        {/* Active Production Tracking */}
        <div style={cardStyle}>
          <h2 style={{...cardTitleStyle, color: '#FFD700'}}>Active Production Batches</h2>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {activeBatches.length > 0 ? (
              activeBatches.map((b, i) => (
                <div key={i} style={{ padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', marginBottom: '10px' }}>
                  <RenderObject data={b} />
                </div>
              ))
            ) : <p>No active batches found.</p>}
          </div>
        </div>

        {/* Pending Consensus Tracking */}
        <div style={cardStyle}>
          <h2 style={{...cardTitleStyle, color: '#00FA9A'}}>Pending Logistics Orders</h2>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {pendingOrders.length > 0 ? (
              pendingOrders.map((o, i) => (
                <div key={i} style={{ padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', marginBottom: '10px' }}>
                  <RenderObject data={o} />
                </div>
              ))
            ) : <p>No pending orders found.</p>}
          </div>
        </div>
      </div>

      <div style={{ ...gridStyle, marginTop: '2rem' }}>
        {/* Batch Explorer */}
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>Batch Explorer</h2>
          <div style={inputGroup}><label style={labelStyle}>Batch ID</label><input style={inputStyle} type="number" value={batchId} onChange={e => setBatchId(e.target.value)} /></div>
          <button style={btnStyle} onClick={fetchBatchData}>Fetch Batch Data</button>
          
          <div style={{ marginTop: '1rem', maxHeight: '400px', overflowY: 'auto', fontSize: '0.8rem', background: 'rgba(0,0,0,0.5)', padding: '1rem', borderRadius: '8px' }}>
            {batchDetails && typeof batchDetails === 'string' && <p>{batchDetails}</p>}
            {batchDetails && typeof batchDetails !== 'string' && (
              <>
                <div style={{ marginBottom: '1rem' }}><h4 style={{ margin: '0 0 8px 0', color: '#FF9FFC' }}>Batch Overview</h4><RenderObject data={batchDetails} /></div>
                <div style={{ marginBottom: '1rem' }}><h4 style={{ margin: '0 0 8px 0', color: '#FF9FFC' }}>Department Processing Logs</h4><p style={{ fontSize: '0.7rem', opacity: 0.6, margin: '-4px 0 8px 0' }}>(Notes entered during department transitions appear here)</p><RenderObject data={batchLogs} /></div>
                <div style={{ marginBottom: '1rem' }}><h4 style={{ margin: '0 0 8px 0', color: '#FF9FFC' }}>Cost Breakdown</h4><RenderObject data={batchCost} /></div>
                <div style={{ marginBottom: '1rem' }}><h4 style={{ margin: '0 0 8px 0', color: '#FF9FFC' }}>Consumed Materials</h4><RenderObject data={batchMats} /></div>
                <div><h4 style={{ margin: '0 0 8px 0', color: '#FF9FFC' }}>Ownership History</h4><RenderObject data={batchHistory} /></div>
              </>
            )}
          </div>
        </div>

        {/* Dispatch Explorer */}
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>Dispatch Explorer</h2>
          <div style={inputGroup}><label style={labelStyle}>Order ID</label><input style={inputStyle} type="number" value={orderId} onChange={e => setOrderId(e.target.value)} /></div>
          <button style={btnStyle} onClick={fetchOrderData}>Fetch Order Data</button>
          
          <div style={{ marginTop: '1rem', maxHeight: '300px', overflowY: 'auto', fontSize: '0.8rem', background: 'rgba(0,0,0,0.5)', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ marginBottom: '1rem' }}><h4 style={{ margin: '0 0 8px 0', color: '#5227FF' }}>Consensus</h4><RenderObject data={dispatchCon} /></div>
            <div style={{ marginBottom: '1rem' }}><h4 style={{ margin: '0 0 8px 0', color: '#5227FF' }}>Signers</h4><RenderObject data={dispatchSig} /></div>
            <div><h4 style={{ margin: '0 0 8px 0', color: '#5227FF' }}>Checkpoints</h4><RenderObject data={transitChecks} /></div>
          </div>
        </div>

        {/* Material Explorer */}
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>Material Explorer</h2>
          <div style={inputGroup}>
            <label style={labelStyle}>Search By</label>
            <select style={inputStyle} value={matSearchType} onChange={e => setMatSearchType(e.target.value as 'ID'|'Farmer')}>
              <option value="ID">Material ID</option>
              <option value="Farmer">Farmer Wallet Address</option>
            </select>
          </div>
          <div style={inputGroup}>
            <label style={labelStyle}>{matSearchType === 'ID' ? 'Material ID' : 'Wallet Address'}</label>
            <input style={inputStyle} value={matSearchValue} onChange={e => setMatSearchValue(e.target.value)} placeholder={matSearchType === 'ID' ? 'e.g. 1' : '0x...'} />
          </div>
          <button style={btnStyle} onClick={fetchMaterialData}>Search Materials</button>
          
          <div style={{ marginTop: '1rem', maxHeight: '300px', overflowY: 'auto', fontSize: '0.8rem', background: 'rgba(0,0,0,0.5)', padding: '1rem', borderRadius: '8px' }}>
            {typeof matResult === 'string' ? <p style={{ margin: 0 }}>{matResult}</p> : <RenderObject data={matResult} />}
          </div>

          <h3 style={{ ...cardTitleStyle, fontSize: '1.1rem', marginTop: '1.5rem', marginBottom: '1rem', color: '#B497CF' }}>Available for Sourcing</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto', fontSize: '0.8rem' }}>
            {availableMaterials.length > 0 ? (
              availableMaterials.map((m, i) => (
                <div key={i} style={{ padding: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', marginBottom: '10px' }}>
                  <RenderObject data={m} />
                </div>
              ))
            ) : <p>No materials available for sourcing.</p>}
          </div>
        </div>

        {/* Mini Queries */}
        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>Actor Explorer</h2>
          <div style={inputGroup}><label style={labelStyle}>Wallet Address</label><input style={inputStyle} value={hrWallet} onChange={e => setHrWallet(e.target.value)} placeholder="0x..." /></div>
          <button style={btnStyle} onClick={fetchActorData}>Fetch Profile</button>
          <div style={{ marginTop: '1rem', maxHeight: '300px', overflowY: 'auto', fontSize: '0.8rem', background: 'rgba(0,0,0,0.5)', padding: '1rem', borderRadius: '8px' }}>
            {typeof hrResult === 'string' ? <p style={{ margin: 0 }}>{hrResult}</p> : <RenderObject data={hrResult} />}
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>Check Outlet Inventory</h2>
          <div style={inputGroup}><label style={labelStyle}>Outlet Wallet</label><input style={inputStyle} value={oiOutlet} onChange={e => setOiOutlet(e.target.value)} placeholder="0x..." /></div>
          <div style={inputGroup}><label style={labelStyle}>Batch ID</label><input style={inputStyle} type="number" value={oiBatch} onChange={e => setOiBatch(e.target.value)} /></div>
          <button style={btnStyle} onClick={checkInventory}>Check Inventory</button>
          {oiResult && (
            <div style={{ marginTop: '1rem', fontSize: '0.85rem', background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: '8px' }}>
              {typeof oiResult === 'string' ? <p style={{ margin: 0 }}>{oiResult}</p> : <RenderObject data={oiResult} />}
            </div>
          )}
        </div>

        <div style={cardStyle}>
          <h2 style={cardTitleStyle}>Check Proposal Status</h2>
          <div style={inputGroup}><label style={labelStyle}>Proposal ID</label><input style={inputStyle} type="number" value={paId} onChange={e => setPaId(e.target.value)} /></div>
          <button style={btnStyle} onClick={checkProposal}>Check Status</button>
          {paResult && <p style={{ marginTop: '1rem', textAlign: 'center', fontWeight: 'bold' }}>{paResult}</p>}
        </div>

      </div>
    </div>
  );
}
