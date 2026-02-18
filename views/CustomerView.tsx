
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MenuItem, CartItem, Order, Offer, DetailedAddress } from '../types';
import { Badge, Button, Card } from '../components/Shared';

interface CustomerViewProps {
  menu: MenuItem[];
  onPlaceOrder: (items: CartItem[], subtotal: number, address: DetailedAddress, deliveryCharge: number, appliedOffer: Offer | null, location?: { lat: number; lng: number }) => void;
  orders: Order[];
  isRestaurantLive: boolean;
  deliveryRatePerKm: number;
  freeDeliveryThreshold: number;
  offers: Offer[];
  restaurantLocation: { lat: number; lng: number };
  onLogout: () => void;
}

const CustomerView: React.FC<CustomerViewProps> = ({ 
  menu, onPlaceOrder, orders, isRestaurantLive, deliveryRatePerKm, freeDeliveryThreshold, offers, restaurantLocation, onLogout 
}) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'cart' | 'track'>('menu');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [appliedOffer, setAppliedOffer] = useState<Offer | null>(null);
  const [addressDetails, setAddressDetails] = useState<Omit<DetailedAddress, 'fullAddress'>>({
    houseNo: '', floor: '', area: '', landmark: ''
  });
  const [distance, setDistance] = useState<number>(0);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const cartSubtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity), 0), [cart]);
  
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    if (selectedLocation) {
      const dist = calculateDistance(restaurantLocation.lat, restaurantLocation.lng, selectedLocation.lat, selectedLocation.lng);
      setDistance(dist);
    }
  }, [selectedLocation]);

  const discount = useMemo(() => {
    if (!appliedOffer || cartSubtotal < appliedOffer.minCartValue) return 0;
    if (appliedOffer.type === 'percent') {
      const calculated = (cartSubtotal * appliedOffer.value) / 100;
      return appliedOffer.maxDiscount && appliedOffer.maxDiscount > 0 
        ? Math.min(calculated, appliedOffer.maxDiscount) 
        : calculated;
    }
    return appliedOffer.value;
  }, [appliedOffer, cartSubtotal]);

  const deliveryCharge = useMemo(() => {
    const calculated = Math.ceil(distance * deliveryRatePerKm);
    const orderValueAfterDiscount = cartSubtotal - discount;
    if (freeDeliveryThreshold > 0 && orderValueAfterDiscount >= freeDeliveryThreshold) {
      return 0;
    }
    return calculated;
  }, [distance, deliveryRatePerKm, cartSubtotal, discount, freeDeliveryThreshold]);

  const totalGst = useMemo(() => cart.reduce((acc, item) => acc + (item.price * item.quantity * item.gstRate) / 100, 0), [cart]);
  const cartTotal = cartSubtotal + totalGst + deliveryCharge - discount;

  // Initialize Google Maps
  useEffect(() => {
    if (activeTab === 'cart' && cart.length > 0) {
      const timer = setTimeout(() => {
        const container = document.getElementById('checkout-map');
        if (container && (window as any).google) {
          const mapOptions = {
            center: { lat: restaurantLocation.lat, lng: restaurantLocation.lng },
            zoom: 15,
            disableDefaultUI: true,
            styles: [
              { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
            ]
          };
          
          const map = new (window as any).google.maps.Map(container, mapOptions);
          const marker = new (window as any).google.maps.Marker({
            position: { lat: restaurantLocation.lat, lng: restaurantLocation.lng },
            map: map,
            draggable: true,
            title: "Drag to your delivery location"
          });

          marker.addListener('dragend', () => {
            const pos = marker.getPosition();
            setSelectedLocation({ lat: pos.lat(), lng: pos.lng() });
          });

          mapInstanceRef.current = map;
          markerRef.current = marker;
          
          // Initial trigger
          setSelectedLocation({ lat: restaurantLocation.lat, lng: restaurantLocation.lng });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeTab, cart.length]);

  const inputClass = "w-full border-2 border-slate-100 bg-slate-50 p-4 rounded-2xl text-sm focus:bg-white focus:border-orange-500 outline-none transition-all placeholder:text-slate-400 text-slate-900 shadow-sm min-h-[56px]";

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) return { ...i, quantity: Math.max(1, i.quantity + delta) };
      return i;
    }));
  };

  const freeDeliveryRemaining = freeDeliveryThreshold - (cartSubtotal - discount);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white pb-24 relative shadow-2xl flex flex-col overflow-hidden">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md p-4 border-b flex justify-between items-center">
        <div className="flex items-center gap-2">
           <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black">B</div>
           <div>
            <h1 className="text-xl font-black text-slate-900">BistroFlow</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Premium Order App</p>
           </div>
        </div>
        <button onClick={() => setActiveTab('cart')} className="relative p-2 text-slate-900">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
          {cart.length > 0 && <span className="absolute top-1 right-1 bg-red-600 text-white text-[10px] px-1.5 rounded-full border-2 border-white font-black">{cart.length}</span>}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {activeTab === 'menu' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {menu.map(item => (
                <Card key={item.id} className="flex gap-4 p-4 shadow-sm ripple">
                  <div className="relative shrink-0">
                    <img src={item.image} className="w-24 h-24 rounded-[2rem] object-cover bg-slate-100 shadow-md" />
                    {item.isVeg && <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-lg border-2 border-green-600 p-1 flex items-center justify-center"><div className="w-full h-full rounded-full bg-green-600"></div></div>}
                  </div>
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-black text-slate-800 text-sm truncate">{item.name}</h3>
                        <span className="text-orange-600 font-black text-sm shrink-0">₹{item.price}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium line-clamp-2 mt-1 leading-relaxed">{item.description}</p>
                    </div>
                    <div className="flex justify-between items-center mt-3">
                      <Badge color="bg-slate-100 text-slate-500">GST {item.gstRate}%</Badge>
                      <button onClick={() => addToCart(item)} className="bg-orange-500 text-white text-[11px] font-black px-5 py-2 rounded-2xl shadow-lg uppercase">ADD +</button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'cart' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Checkout</h2>
            {cart.length === 0 ? (
              <div className="text-center py-24 text-slate-400 italic">Your cart is empty.</div>
            ) : (
              <div className="space-y-8 pb-12">
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between items-center bg-white p-5 rounded-3xl shadow-sm border border-slate-50">
                      <div className="flex-1 min-w-0 pr-4">
                        <h4 className="font-black text-sm text-slate-800 truncate">{item.name}</h4>
                        <p className="text-xs text-orange-600 font-black">₹{item.price * item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-3 bg-slate-100 p-1 rounded-2xl">
                         <button onClick={() => updateQuantity(item.id, -1)} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm font-black">-</button>
                         <span className="text-sm font-black w-6 text-center">{item.quantity}</span>
                         <button onClick={() => updateQuantity(item.id, 1)} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm font-black">+</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-widest px-1">Drop Pin on Delivery Address</h3>
                  <div id="checkout-map" className="h-64 w-full bg-slate-200 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-inner"></div>
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="H.No / Flat" className={inputClass} onChange={e => setAddressDetails({...addressDetails, houseNo: e.target.value})} />
                    <input placeholder="Floor" className={inputClass} onChange={e => setAddressDetails({...addressDetails, floor: e.target.value})} />
                    <input placeholder="Area Name" className={inputClass} onChange={e => setAddressDetails({...addressDetails, area: e.target.value})} />
                    <input placeholder="Landmark" className={inputClass} onChange={e => setAddressDetails({...addressDetails, landmark: e.target.value})} />
                  </div>
                </div>

                <Card className="p-6 space-y-4 bg-slate-900 text-white rounded-[2.5rem]">
                  <div className="space-y-3 text-sm font-bold opacity-80">
                    <div className="flex justify-between"><span>Subtotal</span><span>₹{cartSubtotal.toFixed(0)}</span></div>
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span className={deliveryCharge === 0 ? 'text-green-400 font-black' : ''}>
                        {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between text-2xl font-black border-t border-white/10 pt-4 mt-2">
                    <span>To Pay</span>
                    <span className="text-orange-500">₹{cartTotal.toFixed(0)}</span>
                  </div>
                  <Button 
                    className="w-full !py-5 mt-4" 
                    disabled={!selectedLocation || !addressDetails.houseNo || !isRestaurantLive}
                    onClick={() => {
                      onPlaceOrder(cart, cartSubtotal, { ...addressDetails, fullAddress: `${addressDetails.houseNo}, ${addressDetails.area}` }, deliveryCharge, appliedOffer, selectedLocation!);
                      setCart([]);
                      setActiveTab('track');
                    }}
                  >
                    CONFIRM ORDER
                  </Button>
                </Card>
              </div>
            )}
          </div>
        )}

        {activeTab === 'track' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active Orders</h2>
            {orders.length === 0 ? <p className="text-center italic text-slate-400">No orders placed yet.</p> : orders.map(order => (
              <Card key={order.id} className="p-6 shadow-xl rounded-[2.5rem]">
                <div className="flex justify-between items-start mb-4">
                  <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">#{order.id.slice(0, 8)}</p></div>
                  <Badge color={order.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}>{order.status.toUpperCase()}</Badge>
                </div>
                <p className="text-xs font-black mb-4">₹{order.total.toFixed(0)} • {new Date(order.timestamp).toLocaleTimeString()}</p>
                <Button onClick={() => setSelectedOrderForInvoice(order)} variant="outline" className="w-full !py-3">Invoice</Button>
              </Card>
            ))}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t p-2 flex justify-around items-center h-20 z-[60] max-w-md mx-auto">
         <button onClick={() => setActiveTab('menu')} className={`flex flex-col items-center flex-1 ${activeTab === 'menu' ? 'text-orange-500' : 'text-slate-400'}`}>
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
           <span className="text-[9px] font-black uppercase">Menu</span>
         </button>
         <button onClick={() => setActiveTab('cart')} className={`flex flex-col items-center flex-1 ${activeTab === 'cart' ? 'text-orange-500' : 'text-slate-400'}`}>
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
           <span className="text-[9px] font-black uppercase">Cart</span>
         </button>
         <button onClick={() => setActiveTab('track')} className={`flex flex-col items-center flex-1 ${activeTab === 'track' ? 'text-orange-500' : 'text-slate-400'}`}>
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
           <span className="text-[9px] font-black uppercase">Tracker</span>
         </button>
      </nav>

      {selectedOrderForInvoice && (
        <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/80 backdrop-blur-sm p-0">
          <div className="w-full bg-white rounded-t-[3rem] p-8 shadow-2xl overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black">Receipt</h3>
                <button onClick={() => setSelectedOrderForInvoice(null)} className="text-slate-400 text-3xl">&times;</button>
              </div>
              <div className="space-y-4 text-sm font-bold text-slate-600">
                <p>Order ID: {selectedOrderForInvoice.id.slice(0, 10)}</p>
                <div className="border-t border-dashed py-4">
                  {selectedOrderForInvoice.items.map(item => (
                    <div key={item.id} className="flex justify-between"><span>{item.quantity}x {item.name}</span><span>₹{item.price * item.quantity}</span></div>
                  ))}
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-xl font-black text-slate-900 pt-4 mt-2"><span>Total Paid</span><span className="text-orange-600">₹{selectedOrderForInvoice.total}</span></div>
                </div>
              </div>
              <Button onClick={() => setSelectedOrderForInvoice(null)} className="w-full mt-8">Close</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerView;