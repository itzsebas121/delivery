import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import './maps-delivery-person.css';

interface Props {
  startCoordinates: string;    
  deliveryCoordinates: string; 
}

function parseCoordinates(coordStr: string): { lat: number; lng: number } | null {
  const parts = coordStr.split(",");
  if (parts.length !== 2) return null;

  const lat = parseFloat(parts[0].trim());
  const lng = parseFloat(parts[1].trim());

  if (isNaN(lat) || isNaN(lng)) return null;
  return { lat, lng };
}

export default function MapsDeliveryPerson({ startCoordinates, deliveryCoordinates }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const currentPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const [routeStarted, setRouteStarted] = useState(false);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationMin, setDurationMin] = useState<number | null>(null);

  const start = parseCoordinates(startCoordinates);
  const delivery = parseCoordinates(deliveryCoordinates);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!mapRef.current || mapInstanceRef.current || !start) return;

      const map = new maplibregl.Map({
        container: mapRef.current,
        style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
        center: [start.lng, start.lat],
        zoom: 14,
        pitch: 0,
        bearing: 0,
        interactive: true,
      });

      mapInstanceRef.current = map;

      // Marcadores inicio y destino
      new maplibregl.Marker({ color: "#3498db" })
        .setLngLat([start.lng, start.lat])
        .setPopup(new maplibregl.Popup().setText("Inicio"))
        .addTo(map);

      if (delivery) {
        new maplibregl.Marker({ color: "#2ecc71" })
          .setLngLat([delivery.lng, delivery.lat])
          .setPopup(new maplibregl.Popup().setText("Destino"))
          .addTo(map);
      }

      // Dibujar ruta inicial y guardar distancia y duración
      if (start && delivery) {
        fetch(
          `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${delivery.lng},${delivery.lat}?overview=full&geometries=geojson`
        )
          .then((res) => res.json())
          .then((data) => {
            const route = data.routes?.[0];
            if (!route) return;

            setDistanceKm(route.distance / 1000); // metros a km
            setDurationMin(route.duration / 60); // segundos a minutos

            const geojson: GeoJSON.Feature<GeoJSON.Geometry> = {
              type: "Feature",
              geometry: route.geometry,
              properties: {},
            };

            if (map.getSource("initialRoute")) {
              (map.getSource("initialRoute") as any).setData(geojson);
            } else {
              map.addSource("initialRoute", {
                type: "geojson",
                data: geojson,
              });

              map.addLayer({
                id: "initialRoute",
                type: "line",
                source: "initialRoute",
                layout: {
                  "line-cap": "round",
                  "line-join": "round",
                },
                paint: {
                  "line-color": "#3498db",
                  "line-width": 4,
                },
              });
            }

            const bounds = route.geometry.coordinates.reduce(
              (bounds: maplibregl.LngLatBounds, coord: [number, number]) =>
                bounds.extend(coord),
              new maplibregl.LngLatBounds(route.geometry.coordinates[0], route.geometry.coordinates[0])
            );
            map.fitBounds(bounds, { padding: 60 });
          })
          .catch((e) => console.error("Error cargando ruta inicial:", e));
      }

      return () => {
        map.remove();
        mapInstanceRef.current = null;
      };
    }, 300);

    return () => clearTimeout(timeout);
  }, [start, delivery]);

  function getBearing(start: { lat: number; lng: number }, end: { lat: number; lng: number }) {
    const startLat = (start.lat * Math.PI) / 180;
    const startLng = (start.lng * Math.PI) / 180;
    const endLat = (end.lat * Math.PI) / 180;
    const endLng = (end.lng * Math.PI) / 180;

    const y = Math.sin(endLng - startLng) * Math.cos(endLat);
    const x =
      Math.cos(startLat) * Math.sin(endLat) -
      Math.sin(startLat) * Math.cos(endLat) * Math.cos(endLng - startLng);

    let brng = Math.atan2(y, x);
    brng = (brng * 180) / Math.PI;
    return (brng + 360) % 360;
  }

  const updateLiveRoute = async (pos: { lat: number; lng: number }) => {
    const map = mapInstanceRef.current;
    if (!map || !delivery) return;

    const angleDeg = getBearing(pos, delivery);

    try {
      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${pos.lng},${pos.lat};${delivery.lng},${delivery.lat}?overview=full&geometries=geojson`
      );
      const data = await res.json();
      const route = data.routes?.[0];
      if (!route) return;

      setDistanceKm(route.distance / 1000);
      setDurationMin(route.duration / 60);

      const geojson: GeoJSON.Feature<GeoJSON.Geometry> = {
        type: "Feature",
        geometry: route.geometry,
        properties: {},
      };

      if (map.getSource("liveRoute")) {
        (map.getSource("liveRoute") as any).setData(geojson);
      } else {
        map.addSource("liveRoute", {
          type: "geojson",
          data: geojson,
        });

        map.addLayer({
          id: "liveRoute",
          type: "line",
          source: "liveRoute",
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
          paint: {
            "line-color": "#e74c3c",
            "line-width": 6,
          },
        });
      }

      map.jumpTo({
        center: [pos.lng, pos.lat],
        bearing: angleDeg,
        zoom: 18,
        pitch: 60,
      });

      if (markerRef.current) {
        markerRef.current.setLngLat([pos.lng, pos.lat]);
        const el = markerRef.current.getElement();
        el.style.transform = `rotate(${angleDeg}deg)`;
      } else {
        const el = document.createElement("div");
        el.style.width = "30px";
        el.style.height = "30px";
        el.style.backgroundImage = "url('https://cdn-icons-png.flaticon.com/512/32/32441.png')";
        el.style.backgroundSize = "contain";
        el.style.transform = `rotate(${angleDeg}deg)`;

        markerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat([pos.lng, pos.lat])
          .setPopup(new maplibregl.Popup().setText("Posición actual"))
          .addTo(map);
      }
    } catch (e) {
      console.error("Error actualizando ruta:", e);
    }
  };

  useEffect(() => {
    if (!routeStarted) return;

    const getPositionAndUpdate = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          currentPosRef.current = pos;
          updateLiveRoute(pos);
        },
        (err) => console.error("Geolocalización fallida:", err),
        { enableHighAccuracy: true }
      );
    };

    getPositionAndUpdate();
    const interval = setInterval(getPositionAndUpdate, 3000);

    return () => clearInterval(interval);
  }, [routeStarted]);

  if (!start || !delivery) {
    return <div>⚠️ Coordenadas inválidas</div>;
  }

  return (
    <>
    
      <div
        ref={mapRef}
        style={{
          height: "400px",
          width: "100%",
          border: "2px solid #ccc",
          borderRadius: "10px",
          marginBottom: "10px",
        }}
      />
      {(distanceKm !== null && durationMin !== null) && (
        <div
          className="route-info"
        >
          Distancia: {distanceKm.toFixed(2)} km &nbsp;|&nbsp; Tiempo estimado: {durationMin.toFixed(0)} min
        </div>
      )}
      <button
        onClick={() => {
          setRouteStarted(true);
          const map = mapInstanceRef.current;
          if (!map) return;

          if (map.getLayer("initialRoute")) {
            map.removeLayer("initialRoute");
          }
          if (map.getSource("initialRoute")) {
            map.removeSource("initialRoute");
          }
        }}
        style={{
          padding: "10px 15px",
          backgroundColor: routeStarted ? "gray" : "#e74c3c",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: routeStarted ? "not-allowed" : "pointer",
          marginBottom: "10px",
        }}
        disabled={routeStarted}
      >
        {routeStarted ? "Ruta iniciada" : "Iniciar ruta"}
      </button>

      
    </>
  );
}
