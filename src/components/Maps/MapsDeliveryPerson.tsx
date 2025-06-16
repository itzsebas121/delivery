import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import './maps-delivery-person.css';
import { useAuth } from "../../context/Authcontext";
interface Props {
  startCoordinates: string;
  deliveryCoordinates: string;
  orderstatus: string;
}

function parseCoordinates(coordStr: string): { lat: number; lng: number } | null {
  const parts = coordStr.split(",");
  if (parts.length !== 2) return null;

  const lat = parseFloat(parts[0].trim());
  const lng = parseFloat(parts[1].trim());

  if (isNaN(lat) || isNaN(lng)) return null;
  return { lat, lng };
}

export default function MapsDeliveryPerson({ startCoordinates, deliveryCoordinates, orderstatus }: Props) {
  const { user } = useAuth();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const currentPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const [routeStarted] = useState(false);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationMin, setDurationMin] = useState<number | null>(null);

  const start = parseCoordinates(startCoordinates);
  const delivery = parseCoordinates(deliveryCoordinates);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || !delivery) return;

    const center: [number, number] = delivery
      ? [delivery.lng, delivery.lat]
      : [0, 0];

    const map = new maplibregl.Map({
      container: mapRef.current,
      style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
      center,
      zoom: 14,
      pitch: 0,
      bearing: 0,
      interactive: true,
    });

    mapInstanceRef.current = map;

    // Solo marcador de destino inicial
    new maplibregl.Marker({ color: "#2ecc71" })
      .setLngLat([delivery.lng, delivery.lat])
      .setPopup(new maplibregl.Popup().setText("Destino"))
      .addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [delivery]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !start || !delivery) return;

    new maplibregl.Marker({ color: "#3498db" })
      .setLngLat([start.lng, start.lat])
      .setPopup(new maplibregl.Popup().setText("Inicio"))
      .addTo(map);

    fetch(
      `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${delivery.lng},${delivery.lat}?overview=full&geometries=geojson`
    )
      .then((res) => res.json())
      .then((data) => {
        const route = data.routes?.[0];
        if (!route) return;

        setDistanceKm(route.distance / 1000);
        setDurationMin(route.duration / 60);

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
          new maplibregl.LngLatBounds(
            route.geometry.coordinates[0],
            route.geometry.coordinates[0]
          )
        );
        map.fitBounds(bounds, { padding: 60 });
      })
      .catch((e) => console.error("Error cargando ruta:", e));
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

  if (!delivery) {
    return <div>⚠️ Coordenadas inválidas</div>;
  }
  const handleDelivery = () => {
    alert("Ruta iniciada, por favor sigue las instrucciones en Google Maps.");

    window.open(
      `https://www.google.com/maps/dir/${startCoordinates}/${deliveryCoordinates}?travelmode=driving&dir_action=navigate`,
      '_blank'
    );
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
      {(user?.rol === 'Client' && orderstatus === "Pending") && (
        <div
          className="route-info"
        >
          Su pedido aun no ha sido aceptado
        </div>
      )}
      {(distanceKm !== null && durationMin !== null && orderstatus === "En camino") && (
        <div
          className="route-info"
        >
          Distancia: {distanceKm.toFixed(2)} km &nbsp;|&nbsp; Tiempo estimado: {durationMin.toFixed(0)} min
        </div>
      )}

      {(orderstatus === "En camino" && start && user?.rol === 'Delivery') && (
        <button
          onClick={() => {
            /* setRouteStarted(true); */
            /* const map = mapInstanceRef.current;
            if (!map) return;

            if (map.getLayer("initialRoute")) {
              map.removeLayer("initialRoute");
            }
            if (map.getSource("initialRoute")) {
              map.removeSource("initialRoute");
            } */
           handleDelivery();
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

      )}



    </>
  );
}
