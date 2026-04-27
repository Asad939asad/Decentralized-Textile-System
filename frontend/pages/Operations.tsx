import React, { useState } from 'react';
import { keccak256, toBytes } from 'viem';
import { useWeb3 } from '../src/context/Web3Context';
import { FiberType, QualityGrade, Department, TransitStatus, DispatchType } from '../../backend/contractBridge';
import { containerStyle, titleStyle, gridStyle, cardStyle, cardTitleStyle, inputGroup, labelStyle, inputStyle, textareaStyle, btnStyle } from './Admin';

export default function Operations() {
  const { bridge, isConnected } = useWeb3();
  const [activeTab, setActiveTab] = useState<'Materials' | 'Production' | 'Logistics' | 'Governance'>('Materials');
  const [txStatus, setTxStatus] = useState<{ type: 'success' | 'error' | 'loading'; msg: string } | null>(null);

  const handleTx = async (txPromise: Promise<any>) => {
    if (!bridge || !isConnected) {
      setTxStatus({ type: 'error', msg: 'Please connect your wallet first.' });
      setTimeout(() => setTxStatus(null), 10000);
      return;
    }
    setTxStatus({ type: 'loading', msg: 'Awaiting wallet confirmation...' });
    try {
      const hash = await txPromise;
      setTxStatus({ type: 'success', msg: `Transaction successful! Hash: ${hash}` });
      setTimeout(() => setTxStatus(null), 10000);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.shortMessage || err.details || err.message || 'Transaction failed.';
      setTxStatus({ type: 'error', msg: errMsg });
      setTimeout(() => setTxStatus(null), 10000);
    }
  };

  // State definitions (simplified for brevity, realistically we'd split these into components)
  const [smFiber, setSmFiber] = useState<number>(FiberType.Cotton);
  const [smFarm, setSmFarm] = useState('');
  const [smWeight, setSmWeight] = useState('');
  const [smPrice, setSmPrice] = useState('');
  const [smCert, setSmCert] = useState('');

  const [amId, setAmId] = useState('');
  const [amGrade, setAmGrade] = useState<number>(QualityGrade.Standard);

  const [rmId, setRmId] = useState('');
  const [rmReason, setRmReason] = useState('');

  const [cbCode, setCbCode] = useState('');
  const [cbName, setCbName] = useState('');
  const [cbDesc, setCbDesc] = useState('');
  const [cbMats, setCbMats] = useState('');
  const [cbQty, setCbQty] = useState('');
  const [cbPrice, setCbPrice] = useState('');

  const [mbId, setMbId] = useState('');
  const [mbDept, setMbDept] = useState<number>(Department.Spinning);
  const [mbCost, setMbCost] = useState('');
  const [mbNotes, setMbNotes] = useState('');

  const [qcId, setQcId] = useState('');
  const [qcNotes, setQcNotes] = useState('');

  const [rqId, setRqId] = useState('');
  const [rqReason, setRqReason] = useState('');

  const [rsId, setRsId] = useState('');
  const [rsNotes, setRsNotes] = useState('');

  const [rdId, setRdId] = useState('');
  const [rdPrice, setRdPrice] = useState('');

  const [irId, setIrId] = useState('');
  const [irReason, setIrReason] = useState('');

  const [doBatch, setDoBatch] = useState('');
  const [doDest, setDoDest] = useState('');
  const [doType, setDoType] = useState<number>(DispatchType.OutboundShipment);
  const [doOrigin, setDoOrigin] = useState('');
  const [doDestLoc, setDoDestLoc] = useState('');
  const [doCourier, setDoCourier] = useState('');
  const [doCost, setDoCost] = useState('');

  const [coId, setCoId] = useState('');
  const [clId, setClId] = useState('');
  const [clTrack, setClTrack] = useState('');
  const [cfId, setCfId] = useState('');

  const [tcId, setTcId] = useState('');
  const [tcLoc, setTcLoc] = useState('');
  const [tcStat, setTcStat] = useState<number>(TransitStatus.InTransit);
  const [tcNote, setTcNote] = useState('');

  const [dfId, setDfId] = useState('');
  const [dfReason, setDfReason] = useState('');

  const [crId, setCrId] = useState('');
  const [crNotes, setCrNotes] = useState('');

  // Governance state
  const [pgTitle, setPgTitle]   = useState('');
  const [pgDesc,  setPgDesc]    = useState('');
  const [pgHash,  setPgHash]    = useState('');  // auto-generated
  const [apId, setApId]         = useState('');
  // Local record of proposals so council members can see what each proposal is about
  const [savedProposals, setSavedProposals] = useState<{ id: string; title: string; desc: string; hash: string }[]>([]);

  const generateProposalHash = () => {
    if (!pgTitle || !pgDesc) return alert('Please enter a title and description first.');
    const combined = `TITLE:${pgTitle.trim()}||DESC:${pgDesc.trim()}`;
    const hash = keccak256(toBytes(combined));
    setPgHash(hash);
  };

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Operations Dashboard</h1>
      
      {/* Tab Navigation */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
        {['Materials', 'Production', 'Logistics', 'Governance'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            style={{
              padding: '10px 20px',
              background: activeTab === tab ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              borderRadius: '20px',
              cursor: 'pointer'
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {txStatus && (
        <div style={{ position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)', padding: '1rem 2rem', background: txStatus.type === 'error' ? 'rgba(255, 50, 50, 0.9)' : 'rgba(50, 200, 100, 0.9)', color: 'white', borderRadius: '30px', zIndex: 100, display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', maxWidth: '80vw', wordBreak: 'break-word', maxHeight: '80vh', overflowY: 'auto' }}>
          {txStatus.msg}
          <button style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }} onClick={() => setTxStatus(null)}>×</button>
        </div>
      )}

      {/* MATERIALS TAB */}
      {activeTab === 'Materials' && (
        <div style={gridStyle}>
          <div style={cardStyle}>
            <h2 style={cardTitleStyle}>Source Material (Farmer)</h2>
            <div style={inputGroup}><label style={labelStyle}>Fiber Type</label><select style={inputStyle} value={smFiber} onChange={e => setSmFiber(Number(e.target.value))}>{Object.keys(FiberType).filter(k => isNaN(Number(k))).map(k => <option key={k} value={FiberType[k as keyof typeof FiberType]}>{k}</option>)}</select></div>
            <div style={inputGroup}><label style={labelStyle}>Origin Farm</label><input style={inputStyle} value={smFarm} onChange={e => setSmFarm(e.target.value)} /></div>
            <div style={inputGroup}><label style={labelStyle}>Weight (Kg)</label><input style={inputStyle} type="number" value={smWeight} onChange={e => setSmWeight(e.target.value)} /></div>
            <div style={inputGroup}><label style={labelStyle}>Price per Kg</label><input style={inputStyle} type="number" value={smPrice} onChange={e => setSmPrice(e.target.value)} /></div>
            <div style={inputGroup}><label style={labelStyle}>Certifications</label><input style={inputStyle} value={smCert} onChange={e => setSmCert(e.target.value)} /></div>
            <button style={btnStyle} onClick={() => handleTx(bridge!.sourceMaterial(smFiber, smFarm, BigInt(smWeight||0), BigInt(smPrice||0), BigInt(Math.floor(Date.now()/1000)), smCert))}>Source Material</button>
          </div>
          <div style={cardStyle}>
            <h2 style={cardTitleStyle}>Approve Quality (QC)</h2>
            <div style={inputGroup}><label style={labelStyle}>Material ID</label><input style={inputStyle} type="number" value={amId} onChange={e => setAmId(e.target.value)} /></div>
            <div style={inputGroup}><label style={labelStyle}>Grade</label><select style={inputStyle} value={amGrade} onChange={e => setAmGrade(Number(e.target.value))}>{Object.keys(QualityGrade).filter(k => isNaN(Number(k))).map(k => <option key={k} value={QualityGrade[k as keyof typeof QualityGrade]}>{k}</option>)}</select></div>
            <button style={btnStyle} onClick={() => handleTx(bridge!.approveMaterialQuality(BigInt(amId||0), amGrade))}>Approve Quality</button>
          </div>
          <div style={cardStyle}>
            <h2 style={cardTitleStyle}>Reject Quality (QC)</h2>
            <div style={inputGroup}><label style={labelStyle}>Material ID</label><input style={inputStyle} type="number" value={rmId} onChange={e => setRmId(e.target.value)} /></div>
            <div style={inputGroup}><label style={labelStyle}>Reason</label><textarea style={textareaStyle} value={rmReason} onChange={e => setRmReason(e.target.value)} /></div>
            <button style={{...btnStyle, background: 'rgba(37, 43, 210, 0.5)'}} onClick={() => handleTx(bridge!.rejectMaterialQuality(BigInt(rmId||0), rmReason))}>Reject Quality</button>
          </div>
        </div>
      )}

      {/* PRODUCTION TAB */}
      {activeTab === 'Production' && (
        <div style={gridStyle}>
          <div style={cardStyle}>
            <h2 style={cardTitleStyle}>Create Batch (Dept Head)</h2>
            <div style={inputGroup}><label style={labelStyle}>Batch Code</label><input style={inputStyle} value={cbCode} onChange={e => setCbCode(e.target.value)} /></div>
            <div style={inputGroup}><label style={labelStyle}>Product Name</label><input style={inputStyle} value={cbName} onChange={e => setCbName(e.target.value)} /></div>
            <div style={inputGroup}><label style={labelStyle}>Product Description</label><textarea style={textareaStyle} value={cbDesc} onChange={e => setCbDesc(e.target.value)} /></div>
            <div style={inputGroup}><label style={labelStyle}>Material IDs (comma separated)</label><input style={inputStyle} value={cbMats} onChange={e => setCbMats(e.target.value)} placeholder="1,2,3"/></div>
            <div style={inputGroup}><label style={labelStyle}>Quantity Units</label><input style={inputStyle} type="number" value={cbQty} onChange={e => setCbQty(e.target.value)} /></div>
            <div style={inputGroup}><label style={labelStyle}>Retail Price</label><input style={inputStyle} type="number" value={cbPrice} onChange={e => setCbPrice(e.target.value)} /></div>
            <button style={btnStyle} onClick={() => handleTx(bridge!.createBatch({ batchCode: cbCode, productName: cbName, productDescription: cbDesc, rawMaterialIds: cbMats.split(',').map(x => BigInt(x.trim())), quantityUnits: BigInt(cbQty||0), retailPrice: BigInt(cbPrice||0) }))}>Create Batch</button>
          </div>
          <div style={cardStyle}>
            <h2 style={cardTitleStyle}>Move Batch (Dept Head)</h2>
            <div style={inputGroup}><label style={labelStyle}>Batch ID</label><input style={inputStyle} type="number" value={mbId} onChange={e => setMbId(e.target.value)} /></div>
            <div style={inputGroup}><label style={labelStyle}>Target Dept</label><select style={inputStyle} value={mbDept} onChange={e => setMbDept(Number(e.target.value))}>{Object.keys(Department).filter(k => isNaN(Number(k))).map(k => <option key={k} value={Department[k as keyof typeof Department]}>{k}</option>)}</select></div>
            <div style={inputGroup}><label style={labelStyle}>Cost Added (Per Unit)</label><input style={inputStyle} type="number" value={mbCost} onChange={e => setMbCost(e.target.value)} /></div>
            <div style={inputGroup}><label style={labelStyle}>Notes</label><textarea style={textareaStyle} value={mbNotes} onChange={e => setMbNotes(e.target.value)} /></div>
            <button style={btnStyle} onClick={async () => {
              if (!bridge || !mbId) return;
              try {
                const batchInfo = await bridge.batches(BigInt(mbId)) as any;
                const qty = batchInfo[5]; // quantityUnits is index 5
                const totalCost = BigInt(mbCost || 0) * BigInt(qty);
                handleTx(bridge.moveBatchToDepartment(BigInt(mbId), mbDept, totalCost, mbNotes));
              } catch (e: any) { alert("Failed to fetch batch quantity: " + e.message); }
            }}>Move Batch</button>
          </div>
          <div style={cardStyle}>
            <h2 style={cardTitleStyle}>Approve QC (Inspector)</h2>
            <div style={inputGroup}><label style={labelStyle}>Batch ID</label><input style={inputStyle} type="number" value={qcId} onChange={e => setQcId(e.target.value)} /></div>
            <div style={inputGroup}><label style={labelStyle}>Notes</label><textarea style={textareaStyle} value={qcNotes} onChange={e => setQcNotes(e.target.value)} /></div>
            <button style={{...btnStyle, background: 'rgba(52, 59, 193, 0.5)'}} onClick={() => handleTx(bridge!.approveQC(BigInt(qcId||0), qcNotes))}>Approve QC</button>
          </div>
          <div style={cardStyle}>
            <h2 style={cardTitleStyle}>Reject QC (Inspector)</h2>
            <div style={inputGroup}><label style={labelStyle}>Batch ID</label><input style={inputStyle} type="number" value={rqId} onChange={e => setRqId(e.target.value)} /></div>
            <div style={inputGroup}><label style={labelStyle}>Reason</label><textarea style={textareaStyle} value={rqReason} onChange={e => setRqReason(e.target.value)} /></div>
            <button style={{...btnStyle, background: 'rgba(91, 89, 217, 0.5)'}} onClick={() => handleTx(bridge!.rejectQC(BigInt(rqId||0), rqReason))}>Reject QC</button>
          </div>
          <div style={cardStyle}>
            <h2 style={cardTitleStyle}>Resubmit after QC (Dept Head)</h2>
            <div style={inputGroup}><label style={labelStyle}>Batch ID</label><input style={inputStyle} type="number" value={rsId} onChange={e => setRsId(e.target.value)} /></div>
            <div style={inputGroup}><label style={labelStyle}>Remediation Notes</label><textarea style={textareaStyle} value={rsNotes} onChange={e => setRsNotes(e.target.value)} /></div>
            <button style={btnStyle} onClick={() => handleTx(bridge!.resubmitAfterQCRejection(BigInt(rsId||0), rsNotes))}>Resubmit</button>
          </div>
          <div style={cardStyle}>
            <h2 style={cardTitleStyle}>Finalize Batch (Dept Head)</h2>
            <div style={inputGroup}><label style={labelStyle}>Batch ID</label><input style={inputStyle} type="number" value={rdId} onChange={e => setRdId(e.target.value)} /></div>
            <div style={inputGroup}><label style={labelStyle}>Retail Price (Per Unit)</label><input style={inputStyle} type="number" value={rdPrice} onChange={e => setRdPrice(e.target.value)} /></div>
            <button style={btnStyle} onClick={async () => {
              if (!bridge || !rdId) return;
              try {
                const batchInfo = await bridge.batches(BigInt(rdId)) as any;
                const qty = batchInfo[5]; // quantityUnits
                const totalRetailPrice = BigInt(rdPrice || 0) * BigInt(qty);
                handleTx(bridge.markReadyForDispatch(BigInt(rdId), totalRetailPrice));
              } catch (e: any) { alert('Failed to fetch batch quantity: ' + e.message); }
            }}>Mark Ready for Dispatch</button>
          </div>
          <div style={cardStyle}>
            <h2 style={cardTitleStyle}>Initiate Recall (Admin)</h2>
            <div style={inputGroup}><label style={labelStyle}>Batch ID</label><input style={inputStyle} type="number" value={irId} onChange={e => setIrId(e.target.value)} /></div>
            <div style={inputGroup}><label style={labelStyle}>Reason</label><textarea style={textareaStyle} value={irReason} onChange={e => setIrReason(e.target.value)} /></div>
            <button style={{...btnStyle, background: 'rgba(75, 88, 186, 0.5)'}} onClick={() => handleTx(bridge!.initiateRecall(BigInt(irId||0), irReason))}>Recall Batch</button>
          </div>
        </div>
      )}

      {/* LOGISTICS TAB */}
      {activeTab === 'Logistics' && (
        <div style={gridStyle}>
          <div style={cardStyle}>
            <h2 style={cardTitleStyle}>Create Dispatch Order</h2>
            <div style={inputGroup}><label style={labelStyle}>Batch ID</label><input style={inputStyle} type="number" value={doBatch} onChange={e => setDoBatch(e.target.value)} /></div>
            <div style={inputGroup}><label style={labelStyle}>Destination Custodian</label><input style={inputStyle} value={doDest} onChange={e => setDoDest(e.target.value)} /></div>
            <div style={inputGroup}><label style={labelStyle}>Origin Location</label><input style={inputStyle} value={doOrigin} onChange={e => setDoOrigin(e.target.value)} /></div>
            <div style={inputGroup}><label style={labelStyle}>Destination Location</label><input style={inputStyle} value={doDestLoc} onChange={e => setDoDestLoc(e.target.value)} /></div>
            <div style={inputGroup}><label style={labelStyle}>Courier Name</label><input style={inputStyle} value={doCourier} onChange={e => setDoCourier(e.target.value)} /></div>
            <div style={inputGroup}><label style={labelStyle}>Shipping Cost</label><input style={inputStyle} type="number" value={doCost} onChange={e => setDoCost(e.target.value)} /></div>
            <button style={btnStyle} onClick={() => handleTx(bridge!.createDispatchOrder({ batchId: BigInt(doBatch||0), destinationCustodian: doDest as any, dispatchType: doType, originLocation: doOrigin, destinationLocation: doDestLoc, courierName: doCourier, estimatedDelivery: BigInt(Math.floor(Date.now()/1000)+86400), shippingCost: BigInt(doCost||0) }))}>Create Order</button>
          </div>
          <div style={cardStyle}>
            <h2 style={cardTitleStyle}>Confirm Dispatch Legs</h2>
            <div style={inputGroup}><label style={labelStyle}>Order ID (Origin)</label><input style={inputStyle} type="number" value={coId} onChange={e => setCoId(e.target.value)} /><button style={btnStyle} onClick={() => handleTx(bridge!.confirmDispatch_Origin(BigInt(coId||0)))}>Confirm Origin</button></div>
            <div style={inputGroup}><label style={labelStyle}>Order ID (Logistics)</label><input style={inputStyle} type="number" value={clId} onChange={e => setClId(e.target.value)} /><input style={{...inputStyle, marginTop: '0.5rem'}} placeholder="Tracking #" value={clTrack} onChange={e => setClTrack(e.target.value)} /><button style={btnStyle} onClick={() => handleTx(bridge!.confirmDispatch_Logistics(BigInt(clId||0), clTrack))}>Confirm Logistics</button></div>
            <div style={inputGroup}><label style={labelStyle}>Order ID (Finance)</label><input style={inputStyle} type="number" value={cfId} onChange={e => setCfId(e.target.value)} /><button style={btnStyle} onClick={() => handleTx(bridge!.confirmDispatch_Finance(BigInt(cfId||0)))}>Confirm Finance</button></div>
          </div>
          <div style={cardStyle}>
            <h2 style={cardTitleStyle}>Transit Checkpoints</h2>
            <div style={inputGroup}><label style={labelStyle}>Order ID</label><input style={inputStyle} type="number" value={tcId} onChange={e => setTcId(e.target.value)} /></div>
            <div style={inputGroup}><label style={labelStyle}>Location</label><input style={inputStyle} value={tcLoc} onChange={e => setTcLoc(e.target.value)} /></div>
            <div style={inputGroup}><label style={labelStyle}>Status Note</label><textarea style={textareaStyle} value={tcNote} onChange={e => setTcNote(e.target.value)} /></div>
            <button style={btnStyle} onClick={() => handleTx(bridge!.addTransitCheckpoint(BigInt(tcId||0), tcLoc, TransitStatus.InTransit, tcNote))}>Add Checkpoint</button>
          </div>
          <div style={cardStyle}>
            <h2 style={cardTitleStyle}>Confirm Receipt</h2>
            <div style={inputGroup}><label style={labelStyle}>Order ID</label><input style={inputStyle} type="number" value={crId} onChange={e => setCrId(e.target.value)} /></div>
            <div style={inputGroup}><label style={labelStyle}>Notes</label><textarea style={textareaStyle} value={crNotes} onChange={e => setCrNotes(e.target.value)} /></div>
            <button style={btnStyle} onClick={() => handleTx(bridge!.confirmReceipt(BigInt(crId||0), crNotes))}>Confirm Delivery</button>
          </div>
          <div style={cardStyle}>
            <h2 style={cardTitleStyle}>Mark Dispatch Failed</h2>
            <div style={inputGroup}><label style={labelStyle}>Order ID</label><input style={inputStyle} type="number" value={dfId} onChange={e => setDfId(e.target.value)} /></div>
            <div style={inputGroup}><label style={labelStyle}>Failure Reason</label><textarea style={textareaStyle} value={dfReason} onChange={e => setDfReason(e.target.value)} /></div>
            <button style={{...btnStyle, background: 'rgba(128, 53, 226, 0.5)', borderColor: 'rgba(125, 65, 189, 0.8)'}} onClick={() => handleTx(bridge!.markDispatchFailed(BigInt(dfId||0), dfReason))}>Report Failure</button>
          </div>
        </div>
      )}

      {/* GOVERNANCE TAB */}
      {activeTab === 'Governance' && (
        <div style={gridStyle}>

          {/* Propose */}
          <div style={cardStyle}>
            <h2 style={cardTitleStyle}>Propose a Governance Action</h2>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1rem', lineHeight: 1.5 }}>
              Write your proposal in plain English below. The system will automatically convert it to a cryptographic hash and store it on-chain. Share the Proposal ID with other council members so they can vote.
            </p>
            <div style={inputGroup}>
              <label style={labelStyle}>Proposal Title</label>
              <input style={inputStyle} value={pgTitle} onChange={e => setPgTitle(e.target.value)} placeholder="e.g. Raise QC Inspection Standard" />
            </div>
            <div style={inputGroup}>
              <label style={labelStyle}>Full Description / What to Approve</label>
              <textarea style={{...textareaStyle, minHeight: '100px'}} value={pgDesc} onChange={e => setPgDesc(e.target.value)}
                placeholder="e.g. We propose to require dual-inspector sign-off for all batches above 500kg before they can proceed to Packaging..." />
            </div>

            {/* Step 1: Generate hash from text */}
            <button style={{...btnStyle, background: 'rgba(82,39,255,0.3)', marginBottom: '0.5rem'}} onClick={generateProposalHash}>
              Step 1 — Generate Hash from Description
            </button>

            {pgHash && (
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', wordBreak: 'break-all', fontSize: '0.75rem' }}>
                <p style={{ margin: '0 0 4px 0', color: 'rgba(255,255,255,0.5)' }}>Generated Hash (auto-filled):</p>
                <p style={{ margin: 0, color: '#B497CF' }}>{pgHash}</p>
              </div>
            )}

            {/* Step 2: Submit to blockchain */}
            <div style={{ background: 'rgba(102, 139, 202, 0.1)', border: '1px solid rgba(255,165,0,0.3)', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', fontSize: '1rem', color: 'rgba(50, 214, 50, 0.9)' }}>
              <strong>Only Council Member wallets can propose. Use accounts registered under Council</strong>.
            </div>
            <button style={btnStyle} disabled={!pgHash} onClick={async () => {
              if (!pgHash || !bridge) return;
              setTxStatus({ type: 'loading', msg: 'Awaiting wallet confirmation...' });
              try {
                const txHash = await bridge.proposeGovernanceAction(pgHash as any);
                // Only save locally if the on-chain tx SUCCEEDED
                const newId = (savedProposals.length + 1).toString();
                setSavedProposals(prev => [...prev, { id: newId, title: pgTitle, desc: pgDesc, hash: pgHash }]);
                setTxStatus({ type: 'success', msg: `Proposal submitted! Tx: ${txHash}` });
                setTimeout(() => setTxStatus(null), 10000);
              } catch (err: any) {
                const errMsg = err.shortMessage || err.details || err.message || 'Transaction failed.';
                setTxStatus({ type: 'error', msg: errMsg });
                setTimeout(() => setTxStatus(null), 10000);
              }
            }}>
              Step 2 — Submit Proposal On-Chain
            </button>
          </div>

          {/* Vote */}
          <div style={cardStyle}>
            <h2 style={cardTitleStyle}>Vote on a Proposal</h2>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: '1rem', lineHeight: 1.5 }}>
              Switch to a different council member wallet (Account #1 or #2) and enter the Proposal ID to cast your vote. A proposal needs <strong>2 out of 3</strong> council votes to pass. Votes expire in <strong>7 days</strong>.
            </p>
            <div style={inputGroup}><label style={labelStyle}>Proposal ID</label><input style={inputStyle} type="number" value={apId} onChange={e => setApId(e.target.value)} /></div>
            <button style={btnStyle} onClick={() => handleTx(bridge!.approveProposal(BigInt(apId||0)))}>
              Cast Vote (Approve)
            </button>
          </div>

          {/* Saved Proposals Log */}
          {savedProposals.length > 0 && (
            <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
              <h2 style={cardTitleStyle}>Active Proposals (This Session)</h2>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1rem' }}>These are proposals submitted during this browser session. Share the Proposal ID with other council members so they can vote.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {savedProposals.map((p, i) => (
                  <div key={i} style={{ padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', borderLeft: '3px solid rgba(82,39,255,0.8)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ color: '#B497CF' }}>#{p.id} — {p.title}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Proposal ID: {p.id}</span>
                    </div>
                    <p style={{ margin: '4px 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>{p.desc}</p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', wordBreak: 'break-all' }}>Hash: {p.hash}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
