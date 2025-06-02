import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Props {
  startCoordinates: string;
  deliveryCoordinates: string;
}

function parseCoordinates(coordStr: string): { lat: number; lng: number } | null {
  const parts = coordStr.split(",");
  if (parts.length !== 2) return null;
  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  if (isNaN(lat) || isNaN(lng)) return null;
  return { lat, lng };
}

export default function MapsDeliveryPerson({ startCoordinates, deliveryCoordinates }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const originalRouteRef = useRef<L.Layer | null>(null); // azul
  const liveRouteRef = useRef<L.Layer | null>(null); // rojo
  const startMarkerRef = useRef<L.Marker | null>(null);
  const deliveryMarkerRef = useRef<L.Marker | null>(null);
  const liveMarkerRef = useRef<L.Marker | null>(null);

  const [routeStarted, setRouteStarted] = useState(false);

  // Evitar re-renderizados con ref
  const currentPositionRef = useRef<{ lat: number; lng: number } | null>(null);

  const start = parseCoordinates(startCoordinates);
  const delivery = parseCoordinates(deliveryCoordinates);

  // Inicializar mapa y ruta azul (una vez)
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    if (!start) return;

    const map = L.map(mapRef.current).setView([start.lat, start.lng], 13);
    mapInstanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);

    // Ruta original azul
    const fetchOriginalRoute = async () => {
      if (!start || !delivery) return;

      try {
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${delivery.lng},${delivery.lat}?overview=full&geometries=geojson`
        );
        const data = await res.json();
        const route = data.routes?.[0];
        if (!route) return;

        const coords = route.geometry.coordinates.map(([lng, lat]: number[]) => [lat, lng]);
        if (originalRouteRef.current) {
          map.removeLayer(originalRouteRef.current);
        }
        originalRouteRef.current = L.polyline(coords, { color: "#3498db", weight: 5 }).addTo(map);

        if (!startMarkerRef.current) {
          startMarkerRef.current = L.marker([start.lat, start.lng])
            .addTo(map)
            .bindPopup("Ubicación original");
        }

        if (!deliveryMarkerRef.current) {
          deliveryMarkerRef.current = L.marker([delivery.lat, delivery.lng])
            .addTo(map)
            .bindPopup("Destino");
        }

        map.fitBounds((originalRouteRef.current as L.Polyline).getBounds(), { padding: [20, 20] });
      } catch (error) {
        // Silencioso
      }
    };

    fetchOriginalRoute();
  }, [start, delivery]);

  // Actualiza ruta roja y marcador vivo con flechita apuntando al destino
  const updateLiveRoute = async (pos: { lat: number; lng: number }) => {
    if (!mapInstanceRef.current || !delivery) return;

    const map = mapInstanceRef.current;

    try {
      // Calcular ángulo hacia el destino
      const angle =
        Math.atan2(delivery.lng - pos.lng, delivery.lat - pos.lat) * (180 / Math.PI);

      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${pos.lng},${pos.lat};${delivery.lng},${delivery.lat}?overview=full&geometries=geojson`
      );
      const data = await res.json();
      const route = data.routes?.[0];
      if (!route) return;

      const coords = route.geometry.coordinates.map(
        ([lng, lat]: number[]) => [lat, lng] as [number, number]
      );

      // Eliminar anterior ruta roja si existe
      if (liveRouteRef.current) {
        map.removeLayer(liveRouteRef.current);
      }

      // Crear nueva ruta roja y asegurarse que esté al frente
      liveRouteRef.current = L.polyline(coords, {
        color: "#e74c3c",
        weight: 5,
      }).addTo(map);
      (liveRouteRef.current as L.Polyline).bringToFront(); 

      // Actualizar o crear marcador vivo con rotación
      if (liveMarkerRef.current) {
        liveMarkerRef.current.setLatLng([pos.lat, pos.lng]);
        (liveMarkerRef.current as any).setRotationAngle?.(angle);
      } else {
        const arrowIcon = L.icon({
          iconUrl: "https://png.pngtree.com/png-clipart/20230328/original/pngtree-navigation-arrow-map-pointer-png-image_9007272.png",
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        liveMarkerRef.current = L.marker([pos.lat, pos.lng], {
          icon: arrowIcon,
        })
          .addTo(map)
          .bindPopup("Posición actual (en vivo)")
          .openPopup();

        (liveMarkerRef.current as any).setRotationAngle?.(angle);
        (liveMarkerRef.current as any).setRotationOrigin?.("center center");
      }

      // Siempre mantener zoom máximo centrado en la posición
      map.setView([pos.lat, pos.lng], map.getMaxZoom() || 19); // 🔥 Zoom tope
    } catch (error) {
      // Silencioso
    }
  };


  // Iniciar actualización en vivo cada segundo (puedes cambiarlo)
  useEffect(() => {
    if (!routeStarted) return;

    if (!navigator.geolocation) {
      alert("Geolocalización no soportada en este navegador.");
      return;
    }

    const getLocationAndUpdate = () => {
      console.log("Actualizando ubicación...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = { lat: position.coords.latitude, lng: position.coords.longitude };
          currentPositionRef.current = pos;
          updateLiveRoute(pos);
        },
        (error) => {
          console.error("Error obteniendo ubicación:", error);
        },
        { enableHighAccuracy: true }
      );
    };

    getLocationAndUpdate();
    const interval = window.setInterval(getLocationAndUpdate, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [routeStarted, delivery]);

  // Render
  if (!start || !delivery)
    return (
      <div
        ref={mapRef}
        style={{
          height: "400px",
          width: "100%",
          border: "2px solid #ccc",
          borderRadius: "10px",
        }}
      />
    );

  return (
    <>
      <div
        ref={mapRef}
        style={{
          height: "400px",
          width: "100%",
          border: "2px solid #ccc",
          borderRadius: "10px",
          position: "relative",
          zIndex: 0,
        }}
      />

      <button
        onClick={() => setRouteStarted(true)}
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          zIndex: 1000,
          padding: "10px 15px",
          backgroundColor: routeStarted ? "gray" : "#e74c3c",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: routeStarted ? "not-allowed" : "pointer",
          boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
        }}
        disabled={routeStarted}
        title={routeStarted ? "Ruta en vivo iniciada" : "Iniciar ruta en vivo"}
      >
        {routeStarted ? "Ruta iniciada" : "Iniciar ruta"}
      </button>
    </>
  );
}
