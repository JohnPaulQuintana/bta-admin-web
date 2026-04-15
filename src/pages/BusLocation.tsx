import {
  GoogleMap,
  useLoadScript,
  OverlayView,
  Circle,
} from "@react-google-maps/api";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import {
  UserIcon,
  PhoneIcon,
  TruckIcon,
  UsersIcon,
  MapPinIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

const API_URL = import.meta.env.VITE_API_URL;
const LIBRARIES: "marker"[] = ["marker"];

export default function BusLocation() {
  const { token } = useAuth();
  // const mapRef = useRef<google.maps.Map | null>(null);

  const [buses, setBuses] = useState<any[]>([]);

  const center = useMemo(() => ({ lat: 14.6465, lng: 120.5705 }), []);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  // 🔥 Convert lat/lng → address
  const getAddress = async (lat: number, lng: number) => {
    const geocoder = new window.google.maps.Geocoder();

    return new Promise<string>((resolve) => {
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          resolve(results[0].formatted_address);
        } else {
          resolve("Unknown location");
        }
      });
    });
  };

  // 🔥 Format time
  const formatTime = (date: string) => {
    return new Date(date).toLocaleString();
  };

  // ✅ Fetch + enrich data
  const fetchBusEmergency = async () => {
    try {
      const res = await fetch(`${API_URL}/emergency`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch emergency buses");

      const data = await res.json();

      const enriched = await Promise.all(
        (data.data || []).map(async (bus: any) => {
          if (!bus.latest_location) return bus;

          const address = await getAddress(
            bus.latest_location.latitude,
            bus.latest_location.longitude,
          );

          return {
            ...bus,
            address,
            time: formatTime(bus.latest_location.created_at),
          };
        }),
      );

      setBuses(enriched);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchBusEmergency();

    // 🔄 auto refresh
    const interval = setInterval(fetchBusEmergency, 5000);
    return () => clearInterval(interval);
  }, [token]);

  if (!isLoaded) return <p>Loading map...</p>;

  return (
    <div className="w-full p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-red-600">Emergency Buses Map</h1>

        <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-semibold shadow">
          Total: {buses.length}
        </div>
      </div>

      <div className="w-full h-[500px] rounded-xl overflow-hidden border">
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={center}
          zoom={12}
          // onLoad={(map) => (mapRef.current = map)}
        >
          {buses.map((bus) => {
            if (!bus.latest_location) return null;

            const position = {
              lat: bus.latest_location.latitude,
              lng: bus.latest_location.longitude,
            };

            return (
              <div key={bus.id}>
                {/* 🔴 RADIUS CIRCLE */}
                <Circle
                  center={position}
                  radius={100} // meters (adjust if needed)
                  options={{
                    fillColor: "#ef4444",
                    fillOpacity: 0.2,
                    strokeColor: "#ef4444",
                    strokeOpacity: 0.6,
                    strokeWeight: 1,
                  }}
                />

                {/* 📍 CUSTOM MARKER + TOOLTIP */}
                <OverlayView
                  position={position}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                >
                  <div className="relative">
                    {/* 🔴 Pulse marker */}
                    <div className="absolute -translate-x-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 bg-red-500 rounded-full animate-ping absolute"></div>
                      <div className="w-4 h-4 bg-red-600 rounded-full"></div>
                    </div>

                    {/* 🏷️ Always-visible tooltip */}
                    <div className="absolute -top-44 left-1/2 -translate-x-1/2 w-72 bg-white shadow-xl rounded-xl p-3 text-xs border border-gray-200">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold text-red-600 text-sm flex items-center gap-1">
                          <TruckIcon className="w-4 h-4" />
                          {bus.bus_name}
                        </p>

                        <span className="text-[10px] px-2 py-0.5 bg-red-500 text-white rounded">
                          {bus.status}
                        </span>
                      </div>

                      {/* Plate */}
                      <p className="flex items-center gap-2 text-gray-700 text-[11px]">
                        <TruckIcon className="w-4 h-4 text-gray-500" />
                        Plate: {bus.license_plate}
                      </p>

                      {/* Capacity */}
                      <p className="flex items-center gap-2 text-gray-700 text-[11px]">
                        <UsersIcon className="w-4 h-4 text-gray-500" />
                        {bus.latest_location?.passenger_count ?? 0} /{" "}
                        {bus.bus_capacity}
                      </p>

                      {/* Driver Name */}
                      <p className="flex items-center gap-2 text-gray-700 text-[11px] mt-1">
                        <UserIcon className="w-4 h-4 text-blue-500" />
                        {bus.driver?.name ?? "No active driver"}
                      </p>

                      {/* Driver Phone */}
                      <p className="flex items-center gap-2 text-gray-700 text-[11px]">
                        <PhoneIcon className="w-4 h-4 text-green-500" />
                        {bus.driver?.phone_no ?? "No number"}
                      </p>

                      {/* Address */}
                      <p className="flex items-center gap-2 text-gray-500 text-[10px] mt-2 leading-tight">
                        <MapPinIcon className="w-4 h-4 text-gray-400" />
                        {bus.address}
                      </p>

                      {/* Time */}
                      <p className="flex items-center gap-2 text-gray-400 text-[10px] mt-1">
                        <ClockIcon className="w-4 h-4 text-gray-400" />
                        {bus.time}
                      </p>
                    </div>
                  </div>
                </OverlayView>
              </div>
            );
          })}
        </GoogleMap>
      </div>
    </div>
  );
}
