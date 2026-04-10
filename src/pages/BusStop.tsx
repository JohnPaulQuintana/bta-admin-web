// src/components/BusStop.tsx
import { GoogleMap, useLoadScript } from "@react-google-maps/api";
import { useState, useRef, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const API_URL = import.meta.env.VITE_API_URL;
// Keep libraries static
const LIBRARIES: ("places" | "marker")[] = ["marker"];

interface Notification {
  id: number;
  message: string;
  type: "success" | "error";
}

// interface BusStopType {
//   id: number;
//   name: string;
//   latitude: number;
//   longitude: number;
// }

export default function BusStop() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  // State to store all bus stops
  const [busStops, setBusStops] = useState<
    { id: number; name: string; latitude: number; longitude: number }[]
  >([]);
  const busStopMarkersRef = useRef<google.maps.Marker[]>([]);

  const center = useMemo(() => ({ lat: 14.6465, lng: 120.5705 }), []);
  const { token } = useAuth();

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [modalBusStops, setModalBusStops] = useState<typeof busStops>([]);

  // Add notification
  const addNotification = (message: string, type: "success" | "error") => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(
      () => setNotifications((prev) => prev.filter((n) => n.id !== id)),
      5000,
    );
  };

  // Fetch all bus stops from server
  const fetchBusStops = async () => {
    try {
      const res = await fetch(`${API_URL}/stops`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch bus stops");

      let stops = (await res.json()).data || [];

      // Reorder based on localStorage
    //   const savedOrder = localStorage.getItem("busStopOrder");
    //   if (savedOrder) {
    //     const order = JSON.parse(savedOrder) as number[];
    //     stops.sort(
    //       (a: { id: number }, b: { id: number }) =>
    //         order.indexOf(a.id) - order.indexOf(b.id),
    //     );
    //   }
    stops.sort((a: { id: number; }, b: { id: number; }) => a.id - b.id);
      console.log(stops)
      setBusStops(stops);
    } catch (err: any) {
      console.error(err);
      addNotification(err.message, "error");
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchBusStops();
  }, [token]);

  // Add markers for all bus stops when busStops or map changes
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear old markers
    busStopMarkersRef.current.forEach((marker) => marker.setMap(null));
    busStopMarkersRef.current = [];

    // Add new markers
    busStops.forEach((stop) => {
      const marker = new google.maps.Marker({
        position: { lat: stop.latitude, lng: stop.longitude },
        map: mapRef.current!,
        title: stop.name,
      });
      busStopMarkersRef.current.push(marker);
    });
  }, [busStops]);

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng || !mapRef.current) return;

    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    const location = { lat, lng };

    setSelectedLocation(location);
    mapRef.current.panTo(location);

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        const components = results[0].address_components;
        const placeName = components.find(
          (c) =>
            c.types.includes("establishment") ||
            c.types.includes("point_of_interest"),
        )?.long_name;
        const street = components.find((c) =>
          c.types.includes("route"),
        )?.long_name;
        const city = components.find((c) =>
          c.types.includes("locality"),
        )?.long_name;
        setAddress(placeName || `${street || ""}, ${city || ""}`);
      } else {
        setAddress("Address not found");
      }
    });
  };

  useEffect(() => {
    if (!mapRef.current || !selectedLocation) return;

    if (markerRef.current) markerRef.current.setMap(null);

    markerRef.current = new google.maps.Marker({
      position: selectedLocation,
      map: mapRef.current,
      title: "Bus Stop",
    });
  }, [selectedLocation]);

  const handleSubmit = async () => {
    if (!selectedLocation || !address) {
      addNotification("Please select a location and address", "error");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/stops`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: address,
          latitude: selectedLocation.lat,
          longitude: selectedLocation.lng,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save bus stop");

      addNotification("Bus stop saved successfully", "success");
      setAddress("");
      setSelectedLocation(null);
      if (markerRef.current) markerRef.current.setMap(null);

      // Refresh bus stops after adding new one
      fetchBusStops();
    } catch (err: any) {
      console.error(err);
      addNotification(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReorder = async () => {
    try {
      // Map busStops to only the fields needed for re-insertion
      const reorderedData = modalBusStops.map((stop) => ({
        name: stop.name,
        latitude: stop.latitude,
        longitude: stop.longitude,
        id: stop.id,
      }));

      const res = await fetch(`${API_URL}/stops/reorder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ busStops: reorderedData }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Failed to reorder stops");
      // Save order locally
      localStorage.setItem(
        "busStopOrder",
        JSON.stringify(modalBusStops.map((s) => s.id)),
      );

      addNotification("Bus stops reordered successfully", "success");
      setIsReorderModalOpen(false);

      // Refresh bus stops from API
      //   fetchBusStops();
      setBusStops([...modalBusStops]);
    } catch (err: any) {
      console.error(err);
      addNotification(err.message, "error");
    }
  };

  if (!isLoaded) return <p>Loading map...</p>;

  return (
    <div className="w-full mt-12 md:mt-0 p-4">
      {/* Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg shadow-lg transform transition-all duration-300 ${
              notification.type === "success"
                ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                : "bg-red-50 border border-red-200 text-red-800"
            }`}
          >
            <p className="text-sm font-medium">{notification.message}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Register Bus Stop</h1>
        <button
          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
          onClick={() => {
            // setBusStops(busStops); // snapshot current order
            setModalBusStops([...busStops]); // copy current order to modal
            setIsReorderModalOpen(true);
          }}
        >
          Reorder Bus Stops
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MAP */}
        <div className="w-full h-[400px] rounded-xl overflow-hidden border">
          <GoogleMap
            mapContainerStyle={{ width: "100%", height: "100%" }}
            center={center}
            zoom={12}
            // onLoad={(map) => (mapRef.current = map)}
            onLoad={(map) => {
              mapRef.current = map;
            }}
            onClick={handleMapClick}
          />
        </div>

        {/* FORM */}
        <div className="space-y-4 p-4 border border-gray-400 rounded-xl shadow-sm bg-white">
          <input
            type="text"
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={selectedLocation?.lat || ""}
              readOnly
              placeholder="Latitude"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
            />
            <input
              type="text"
              value={selectedLocation?.lng || ""}
              readOnly
              placeholder="Longitude"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
            />
          </div>

          <button
            disabled={!selectedLocation || loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 transition text-white px-4 py-2 rounded-lg"
            onClick={handleSubmit}
          >
            {loading ? "Saving..." : "Save Bus Stop"}
          </button>
        </div>
      </div>

      {isReorderModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-xs">
          <div className="border-2 border-green-600 w-full max-w-md rounded-xl p-6 shadow-lg bg-green-50">
            <h2 className="text-2xl font-bold text-green-800 mb-4">
              Reorder Bus Stops
            </h2>

            <DragDropContext
              onDragEnd={(result) => {
                if (!result.destination) return;

                // Make a copy of modalBusStops
                const items = Array.from(modalBusStops);

                // Remove the dragged item
                const [reordered] = items.splice(result.source.index, 1);

                // Insert it at the new position
                items.splice(result.destination.index, 0, reordered);

                // Update the modal state only
                setModalBusStops(items);
              }}
            >
              <Droppable droppableId="busStops">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2 max-h-80 overflow-y-auto"
                  >
                    {modalBusStops.map((stop, index) => (
                      <Draggable
                        key={stop.id}
                        draggableId={stop.id.toString()}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-3 border-l-4 border-green-600 rounded flex items-center font-medium ${
                              snapshot.isDragging
                                ? "bg-green-200"
                                : "bg-green-100"
                            }`}
                          >
                            {/* Number + Name */}
                            <span className="text-green-800 font-bold mr-2">{index + 1}.</span>
                            <span className="text-green-800">{stop.name}</span>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            <div className="flex justify-end mt-6 gap-3">
              <button
                className="px-4 py-2 bg-green-300 text-green-800 rounded hover:bg-green-400"
                onClick={() => setIsReorderModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={handleSaveReorder}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
