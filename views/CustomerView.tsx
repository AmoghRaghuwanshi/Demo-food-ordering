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
  menu, onPlaceOrder, orders, isRestaurantLive, deliveryRatePerKm, freeDeliveryThreshold, restaurantLocation
}) => {
  const [activeTab, setActiveTab] = useState<'menu' | 'cart' | 'track'>('menu');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [appliedOffer] = useState<Offer | null>(null);
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
  }, [selectedLocation, restaurantLocation]);

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
          setSelectedLocation({ lat: restaurantLocation.lat, lng: restaurantLocation.lng });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeTab, cart.length, restaurantLocation]);

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

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white pb-24 relative shadow-2xl flex flex-col overflow-hidden">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md p-4 border-b flex justify-between items-center">
        <div className="flex items-center gap-2">
           <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white font-black">B</div>
           <div><h1 className="text-xl font-black text-slate-900">BistroFlow</h1></div>
        </div>
        <button onClick={() => setActiveTab('cart')} className="relative p-2">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
          {cart.length > 0 && <span className="absolute top-1 right-1 bg-red-600 text-white text-[10px] px-1.5 rounded-full border-2 border-white font-black">{cart.length}</span>}
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {activeTab === 'menu' && (
          <div className="grid grid-cols-1 gap-4">
            {menu.map((item: MenuItem) => (
              <Card key={item.id} className="flex gap-4 p-4 shadow-sm ripple">
                <img src={item.image} className="w-24 h-24 rounded-[2rem] object-cover" alt={item.name} />
                <div className="flex-1">
                  <h3 className="font-black text-sm">{item.name}</h3>
                  <span className="text-orange-600 font-black text-sm">₹{item.price}</span>
                  <div className="flex justify-between items-center mt-3">
                    <Badge color="bg-slate-100 text-slate-500">GST {item.gstRate}%</Badge>
                    <button onClick={() => addToCart(item)} className="bg-orange-500 text-white text-[11px] font-black px-4 py-2 rounded-xl uppercase">ADD +</button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'cart' && (
          <div className="space-y-6 pb-12">
            {cart.length === 0 ? <p className="text-center py-10">Cart empty</p> : (
              <>
                {cart.map((item: CartItem) => (
                  <div key={item.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                    <div><h4 className="font-bold text-sm">{item.name}</h4><p className="text-xs">₹{item.price * item.quantity}</p></div>
                    <div className="flex gap-3 items-center">
                      <button onClick={() => updateQuantity(item.id, -1)}>-</button>
                      <span className="font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)}>+</button>
                    </div>
                  </div>
                ))}
                <div id="checkout-map" className="h-64 rounded-2xl bg-slate-100"></div>
                <Button className="w-full py-4" disabled={!selectedLocation || !addressDetails.houseNo || !isRestaurantLive} onClick={() => {
                   onPlaceOrder(cart, cartSubtotal, { ...addressDetails, fullAddress: `${addressDetails.houseNo}, ${addressDetails.area}` }, deliveryCharge, appliedOffer, selectedLocation!);
                   setCart([]); setActiveTab('track');
                }}>Place Order ₹{cartTotal.toFixed(0)}</Button>
              </>
            )}
          </div>
        )}

        {activeTab === 'track' && (
          <div className="space-y-4">
            {orders.map((order: Order) => (
              <Card key={order.id} className="p-4">
                <div className="flex justify-between"><span className="text-xs font-bold">#{order.id.slice(0,8)}</span><Badge>{order.status}</Badge></div>
                <p className="text-sm font-black mt-2">₹{order.total.toFixed(0)}</p>
                <Button className="w-full mt-3 !py-2 text-xs" variant="outline" onClick={() => setSelectedOrderForInvoice(order)}>Invoice</Button>
              </Card>
            ))}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t p-2 flex justify-around h-20 max-w-md mx-auto">
         <button onClick={() => setActiveTab('menu')} className={activeTab === 'menu' ? 'text-orange-500' : 'text-slate-400'}>MENU</button>
         <button onClick={() => setActiveTab('cart')} className={activeTab === 'cart' ? 'text-orange-500' : 'text-slate-400'}>CART</button>
         <button onClick={() => setActiveTab('track')} className={activeTab === 'track' ? 'text-orange-500' : 'text-slate-400'}>TRACK</button>
      </nav>

      {selectedOrderForInvoice && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl w-full max-w-sm">
            <h3 className="font-black text-lg mb-4">Order Details</h3>
            <div className="space-y-2 mb-6">
              {selectedOrderForInvoice.items.map((i: CartItem) => (
                <div key={i.id} className="flex justify-between text-sm"><span>{i.name} x {i.quantity}</span><span>₹{i.price * i.quantity}</span></div>
              ))}
              <div className="border-t pt-2 font-black flex justify-between"><span>Total</span><span>₹{selectedOrderForInvoice.total}</span></div>
            </div>
            <Button className="w-full" onClick={() => setSelectedOrderForInvoice(null)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerView;