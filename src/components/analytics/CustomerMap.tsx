import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Users, TrendingUp } from "lucide-react";
import { useNeighborhoodStats, useClientLocations } from "@/hooks/useCustomerMap";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

// Dynamically import Leaflet to avoid SSR issues
const loadLeaflet = async () => {
  const L = await import('leaflet');
  await import('leaflet/dist/leaflet.css');
  return L.default;
};

export const CustomerMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const { data: neighborhoodStats, isLoading: statsLoading } = useNeighborhoodStats();
  const { data: clientLocations, isLoading: locationsLoading } = useClientLocations();

  const isLoading = statsLoading || locationsLoading;

  useEffect(() => {
    if (!mapRef.current || isLoading) return;

    const initMap = async () => {
      const L = await loadLeaflet();

      // Clean up existing map
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // Default to São Paulo if no locations
      let centerLat = -23.5505;
      let centerLng = -46.6333;
      let zoom = 11;

      // Calculate center from locations
      const locationsWithCoords = clientLocations?.filter(l => l.latitude && l.longitude) || [];
      if (locationsWithCoords.length > 0) {
        const avgLat = locationsWithCoords.reduce((sum, l) => sum + (l.latitude || 0), 0) / locationsWithCoords.length;
        const avgLng = locationsWithCoords.reduce((sum, l) => sum + (l.longitude || 0), 0) / locationsWithCoords.length;
        centerLat = avgLat;
        centerLng = avgLng;
      }

      // Initialize map
      const map = L.map(mapRef.current!).setView([centerLat, centerLng], zoom);
      mapInstanceRef.current = map;

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18,
      }).addTo(map);

      // Add markers for neighborhoods with clients
      neighborhoodStats?.forEach(stat => {
        if (stat.avg_latitude && stat.avg_longitude) {
          const circle = L.circleMarker([stat.avg_latitude, stat.avg_longitude], {
            radius: Math.min(20, Math.max(8, stat.clients_count * 3)),
            fillColor: '#3b82f6',
            color: '#1d4ed8',
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.5,
          }).addTo(map);

          circle.bindPopup(`
            <strong>${stat.neighborhood}</strong><br/>
            ${stat.clients_count} cliente(s)
          `);
        }
      });
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [clientLocations, neighborhoodStats, isLoading]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const totalClients = neighborhoodStats?.reduce((sum, s) => sum + s.clients_count, 0) || 0;
  const topNeighborhoods = neighborhoodStats?.slice(0, 5) || [];

  return (
    <div className="space-y-4">
      {/* Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Mapa de Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {totalClients > 0 ? (
            <div 
              ref={mapRef} 
              className="h-[400px] w-full rounded-lg overflow-hidden border"
              style={{ zIndex: 0 }}
            />
          ) : (
            <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground bg-muted/30 rounded-lg">
              <MapPin className="h-12 w-12 mb-3 opacity-50" />
              <p className="font-medium">Nenhum dado de localização</p>
              <p className="text-sm">Adicione bairros aos clientes para ver o mapa</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Neighborhoods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Bairros que Mais Geram Clientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topNeighborhoods.length > 0 ? (
            <div className="space-y-3">
              {topNeighborhoods.map((stat, idx) => (
                <div 
                  key={stat.id} 
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      idx === 0 ? 'bg-yellow-500/20 text-yellow-600' :
                      idx === 1 ? 'bg-gray-400/20 text-gray-600' :
                      idx === 2 ? 'bg-orange-500/20 text-orange-600' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium">{stat.neighborhood}</p>
                      {stat.city && (
                        <p className="text-sm text-muted-foreground">{stat.city}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="gap-1">
                      <Users className="h-3 w-3" />
                      {stat.clients_count}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Adicione bairros aos clientes para ver estatísticas</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
