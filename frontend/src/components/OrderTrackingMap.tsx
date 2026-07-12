// src/components/OrderTrackingMap.tsx
import React, { useEffect, useState } from 'react';
import { Compass, Shield, Phone, User } from 'lucide-react';
import deliveryService from '../services/deliveryService';
import type { DeliveryAssignment } from '../services/deliveryService';

interface OrderTrackingMapProps {
  orderId: number;
  sellerName: string;
  sellerLatitude?: number;
  sellerLongitude?: number;
  buyerName: string;
  buyerLatitude?: number;
  buyerLongitude?: number;
  onClose: () => void;
}

const OrderTrackingMap: React.FC<OrderTrackingMapProps> = ({
  orderId,
  sellerName,
  sellerLatitude = 12.9716,
  sellerLongitude = 77.5946,
  buyerName,
  buyerLatitude = 12.9816,
  buyerLongitude = 77.6046,
  onClose,
}) => {
  const [assignment, setAssignment] = useState<DeliveryAssignment | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync initial state from REST API
  useEffect(() => {
    const fetchAssignment = async () => {
      try {
        const list = await deliveryService.getMyAssignments();
        const orderAssignment = list.find((a) => a.orderId === orderId);
        if (orderAssignment) setAssignment(orderAssignment);
      } catch (_err) {
        // Silently ignore — ws will supply updates
      }
    };
    fetchAssignment();
  }, [orderId]);

  // Connect to live WebSocket tracking channel
  useEffect(() => {
    const wsUrl = `ws://localhost:8085/ws/tracking?orderId=${orderId}`;
    let socket: WebSocket | null = new WebSocket(wsUrl);

    socket.onopen = () => {
      setWsConnected(true);
      setError(null);
    };

    socket.onmessage = (event) => {
      try {
        const updatedAssignment = JSON.parse(event.data) as DeliveryAssignment;
        setAssignment(updatedAssignment);
      } catch (err) {
        console.error('Failed to parse socket message:', err);
      }
    };

    socket.onerror = () => {
      setWsConnected(false);
      setError('Live tracking disconnected. Retrying...');
    };

    socket.onclose = () => {
      setWsConnected(false);
    };

    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [orderId]);

  // Calculate coordinates on the SVG map (normalized between 5% and 95%)
  const minLat = Math.min(sellerLatitude, buyerLatitude, assignment?.currentLatitude ?? (sellerLatitude + buyerLatitude) / 2);
  const maxLat = Math.max(sellerLatitude, buyerLatitude, assignment?.currentLatitude ?? (sellerLatitude + buyerLatitude) / 2);
  const minLng = Math.min(sellerLongitude, buyerLongitude, assignment?.currentLongitude ?? (sellerLongitude + buyerLongitude) / 2);
  const maxLng = Math.max(sellerLongitude, buyerLongitude, assignment?.currentLongitude ?? (sellerLongitude + buyerLongitude) / 2);

  const getPos = (lat: number, lng: number) => {
    const latSpan = maxLat - minLat || 0.0001;
    const lngSpan = maxLng - minLng || 0.0001;

    // Map latitude to Y (top/bottom flipped)
    const y = 90 - ((lat - minLat) / latSpan) * 80;
    // Map longitude to X
    const x = 10 + ((lng - minLng) / lngSpan) * 80;

    return { x: `${x}%`, y: `${y}%` };
  };

  const sellerPos = getPos(sellerLatitude, sellerLongitude);
  const buyerPos = getPos(buyerLatitude, buyerLongitude);
  const driverPos = assignment?.currentLatitude && assignment?.currentLongitude
    ? getPos(assignment.currentLatitude, assignment.currentLongitude)
    : sellerPos;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col lg:flex-row h-[550px]">
      
      {/* ── VISUAL MAP SIMULATION PANEL ── */}
      <div className="flex-1 bg-gray-950 relative overflow-hidden flex flex-col justify-between min-h-[300px]">
        {/* Futuristic Map Grid Layout */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />
        
        {/* Top Header overlay */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
          <div className="bg-gray-900/90 border border-gray-800 px-3.5 py-2 rounded-xl backdrop-blur-md flex items-center gap-2 text-xs">
            <div className={`w-2.5 h-2.5 rounded-full ${wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-gray-400 font-semibold">
              {wsConnected ? 'Connected to Node WebSocket' : 'Offline tracking mode'}
            </span>
          </div>
          <span className="bg-gray-900/90 border border-gray-800 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-emerald-400">
            Order #{orderId}
          </span>
        </div>

        {/* SVG Live Render Node Map */}
        <svg className="w-full h-full absolute inset-0 py-10 px-10">
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Dotted path route line between nodes */}
          <line
            x1={sellerPos.x}
            y1={sellerPos.y}
            x2={buyerPos.x}
            y2={buyerPos.y}
            stroke="url(#routeGradient)"
            strokeWidth="3.5"
            strokeDasharray="6,6"
          />

          {/* Seller Station Circle */}
          <g transform={`translate(0, 0)`}>
            <circle cx={sellerPos.x} cy={sellerPos.y} r="25" fill="#10b981" fillOpacity="0.08" className="animate-pulse" />
            <circle cx={sellerPos.x} cy={sellerPos.y} r="8" fill="#10b981" stroke="#000" strokeWidth="2" />
          </g>

          {/* Buyer Station Circle */}
          <g>
            <circle cx={buyerPos.x} cy={buyerPos.y} r="25" fill="#3b82f6" fillOpacity="0.08" className="animate-pulse" />
            <circle cx={buyerPos.x} cy={buyerPos.y} r="8" fill="#3b82f6" stroke="#000" strokeWidth="2" />
          </g>

          {/* Live Driver Circle */}
          {assignment && (
            <g transform={`translate(0, 0)`}>
              <circle cx={driverPos.x} cy={driverPos.y} r="28" fill="#f59e0b" fillOpacity="0.12" className="animate-ping" style={{ animationDuration: '3s' }} />
              <circle cx={driverPos.x} cy={driverPos.y} r="10" fill="#f59e0b" stroke="#000" strokeWidth="2" />
            </g>
          )}

          {/* Text Labels on map */}
          <text x={sellerPos.x} y={parseFloat(sellerPos.y) - 3 + '%'} fill="#34d399" fontSize="10" fontWeight="bold" textAnchor="middle">
            Seller: {sellerName}
          </text>
          <text x={buyerPos.x} y={parseFloat(buyerPos.y) + 6 + '%'} fill="#60a5fa" fontSize="10" fontWeight="bold" textAnchor="middle">
            Buyer: {buyerName}
          </text>
          {assignment && (
            <text x={driverPos.x} y={parseFloat(driverPos.y) - 4 + '%'} fill="#fbbf24" fontSize="10" fontWeight="bold" textAnchor="middle">
              Courier Hub
            </text>
          )}
        </svg>

        {/* Bottom map summary Overlay */}
        <div className="p-4 bg-gradient-to-t from-gray-950 via-gray-950/70 to-transparent flex justify-between items-end relative z-10">
          <div className="text-[10px] text-gray-500 font-mono">
            <p>Seller Coordinates: {sellerLatitude.toFixed(4)}, {sellerLongitude.toFixed(4)}</p>
            <p>Buyer Coordinates: {buyerLatitude.toFixed(4)}, {buyerLongitude.toFixed(4)}</p>
            {assignment && assignment.currentLatitude !== undefined && assignment.currentLongitude !== undefined && (
              <p className="text-amber-400">Driver Coordinates: {assignment.currentLatitude.toFixed(4)}, {assignment.currentLongitude.toFixed(4)}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="bg-gray-900 hover:bg-gray-800 text-white font-bold px-4 py-2 border border-gray-800 rounded-xl text-xs transition-colors"
          >
            Close Tracking Map
          </button>
        </div>

      </div>

      {/* ── COURIER STATE CONTROL PANEL ── */}
      <aside className="w-full lg:w-80 bg-gray-900 border-t lg:border-t-0 lg:border-l border-gray-850 p-6 flex flex-col justify-between">
        <div className="space-y-6">
          <div>
            <h4 className="text-xs uppercase font-extrabold text-gray-500 tracking-wider">Escrow Courier Track</h4>
            <h3 className="text-xl font-bold mt-1 text-white">Grid Dispatch State</h3>
            {error && <p className="text-rose-450 text-[11px] font-semibold mt-2">{error}</p>}
          </div>

          {!assignment ? (
            <div className="bg-gray-950 border border-gray-850 p-4 rounded-2xl text-center text-xs text-gray-500">
              <Compass className="w-8 h-8 text-gray-700 mx-auto mb-2" />
              Waiting for delivery dispatcher to assign courier partner...
            </div>
          ) : (
            <div className="space-y-4 text-xs">
              
              {/* Courier Profile Detail */}
              <div className="bg-gray-950 p-4 border border-gray-855 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-white leading-tight">{assignment.agentName || 'Platform Courier'}</h5>
                    <p className="text-[9px] text-gray-500 uppercase tracking-widest">Active Dispatcher</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-gray-400">
                  <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Call Agent: <a href="tel:555" className="text-emerald-400 font-bold font-mono">555-SHARE</a></span>
                </div>
              </div>

              {/* Status Timestamps */}
              <div className="space-y-2">
                <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider block">Live Delivery Status</span>
                
                <div className="space-y-2 border-l-2 border-gray-800 pl-4 ml-2">
                  <div className="relative">
                    <div className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border border-black ${
                      ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED'].includes(assignment.deliveryStatus) ? 'bg-emerald-500' : 'bg-gray-800'
                    }`} />
                    <p className="font-semibold text-white">Order Accepted & Claimed</p>
                    <p className="text-[9px] text-gray-550">Courier partner confirmed transport contract</p>
                  </div>

                  <div className="relative">
                    <div className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border border-black ${
                      ['PICKED_UP', 'IN_TRANSIT', 'DELIVERED'].includes(assignment.deliveryStatus) ? 'bg-emerald-500' : 'bg-gray-800'
                    }`} />
                    <p className="font-semibold text-white">Battery Dispatched</p>
                    {assignment.pickedUpAt ? (
                      <p className="text-[9px] text-gray-500">Collected at {new Date(assignment.pickedUpAt).toLocaleTimeString()}</p>
                    ) : (
                      <p className="text-[9px] text-gray-550">Pending collection from seller</p>
                    )}
                  </div>

                  <div className="relative">
                    <div className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border border-black ${
                      assignment.deliveryStatus === 'DELIVERED' ? 'bg-emerald-500' : 'bg-gray-800'
                    }`} />
                    <p className="font-semibold text-white">Delivered & Complete</p>
                    {assignment.deliveredAt ? (
                      <p className="text-[9px] text-gray-500">Completed at {new Date(assignment.deliveredAt).toLocaleTimeString()}</p>
                    ) : (
                      <p className="text-[9px] text-gray-550">Escrow earnings waiting for delivery drop-off</p>
                    )}
                  </div>

                  {/* Return Flow section */}
                  {assignment.orderStatus === 'RETURN_PENDING' && (
                    <div className="relative pt-3 border-t border-gray-855/50 mt-3">
                      <div className="relative">
                        <div className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border border-black ${
                          ['RETURN_PICKED_UP', 'RETURNED'].includes(assignment.deliveryStatus) ? 'bg-emerald-500' : 'bg-gray-aa'
                        }`} />
                        <p className="font-semibold text-orange-450">Return Picked Up</p>
                        <p className="text-[9px] text-gray-500">Empty battery pack collected from buyer</p>
                      </div>
                      <div className="relative mt-2">
                        <div className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full border border-black ${
                          assignment.deliveryStatus === 'RETURNED' ? 'bg-emerald-500' : 'bg-gray-800'
                        }`} />
                        <p className="font-semibold text-orange-450">Returned to Seller</p>
                        {assignment.returnedAt ? (
                          <p className="text-[9px] text-gray-500">Returned at {new Date(assignment.returnedAt).toLocaleTimeString()}</p>
                        ) : (
                          <p className="text-[9px] text-gray-550">Pending drop-off back to seller station</p>
                        )}
                      </div>
                    </div>
                  )}

                </div>

              </div>

            </div>
          )}
        </div>

        <div className="bg-gray-950 p-4 border border-gray-850 rounded-2xl mt-4 flex items-start gap-2.5 text-[10px] text-gray-500">
          <Shield className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <p>
            Funds are locked in escrow. On delivered confirmation, seller earnings ($
            {(assignment?.totalAmount ? assignment.totalAmount - (assignment.deliveryStatus === 'RETURNED' ? 0 : 5) : 0).toFixed(2)}) 
            will be deposited directly.
          </p>
        </div>
      </aside>

    </div>
  );
};

export default OrderTrackingMap;
