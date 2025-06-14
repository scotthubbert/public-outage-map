// Map management and ArcGIS integration
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import Graphic from '@arcgis/core/Graphic';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import FeatureLayer from '@arcgis/core/layers/FeatureLayer';
import Search from '@arcgis/core/widgets/Search';
import Locate from '@arcgis/core/widgets/Locate';
import Extent from '@arcgis/core/geometry/Extent';
import Point from '@arcgis/core/geometry/Point';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import PopupTemplate from '@arcgis/core/PopupTemplate';

export class MapManager {
    constructor(config = null) {
        this.map = null;
        this.view = null;
        this.fiberLayer = null;
        this.electricLayer = null;
        this.searchWidget = null;
        this.locateWidget = null;
        this.config = config;

        // Define map bounds from config
        const mapConfig = config?.map || {};
        this.bounds = new Extent({
            xmin: mapConfig.bounds?.xmin || -88.3319638467807,
            ymin: mapConfig.bounds?.ymin || 33.440523708494564,
            xmax: mapConfig.bounds?.xmax || -87.35488507018964,
            ymax: mapConfig.bounds?.ymax || 34.73445506886154,
            spatialReference: { wkid: 4326 }
        });

        // Calculate center point for initial view
        this.centerPoint = {
            longitude: mapConfig.center?.longitude || (this.bounds.xmin + this.bounds.xmax) / 2,
            latitude: mapConfig.center?.latitude || (this.bounds.ymin + this.bounds.ymax) / 2
        };

        // Theme detection
        this.isDarkTheme = this.detectDarkTheme();
    }

    async init() {
        try {
            // Ensure map container exists and is visible
            const mapContainer = document.getElementById('map');
            if (!mapContainer) {
                throw new Error('Map container not found');
            }

            // Force container dimensions
            mapContainer.style.width = '100%';
            mapContainer.style.height = '100%';
            mapContainer.style.position = 'relative';

            // Get basemap based on theme
            const basemap = this.getBasemapForTheme();

            // Create the map
            this.map = new Map({
                basemap: basemap
            });

            // Create the view with explicit dimensions
            this.view = new MapView({
                container: mapContainer,
                map: this.map,
                extent: this.bounds,
                constraints: {
                    rotationEnabled: false,
                    minZoom: this.config?.map?.minZoom || 8,
                    maxZoom: this.config?.map?.maxZoom || 12
                },
                ui: {
                    components: ["attribution", "zoom"]
                }
            });

            // Create graphics layers
            this.createLayers();

            // Add widgets
            this.setupWidgets();

            // Wait for view to be ready
            await this.view.when();

            // Set up theme monitoring
            this.setupThemeMonitoring();

            // Force a resize to ensure proper rendering after shell layout is ready
            setTimeout(() => {
                if (this.view) {
                    const container = document.getElementById('map');
                    if (container) {
                        const rect = container.getBoundingClientRect();
                        console.log(`Map container after init: ${rect.width}x${rect.height}`);

                        if (rect.width > 0 && rect.height > 0) {
                            this.resize();
                            console.log('✅ Map container has proper dimensions, resized');
                            console.log(`📍 Map bounds: SW [${this.bounds.xmin}, ${this.bounds.ymin}], NE [${this.bounds.xmax}, ${this.bounds.ymax}]`);
                        } else {
                            console.log('⚠️ Map container still has zero dimensions, retrying...');
                            // Force container to be visible and retry
                            container.style.height = '400px';
                            container.style.minHeight = '400px';
                            setTimeout(() => this.resize(), 500);
                        }
                    }
                }
            }, 300);

            console.log(`Map initialized successfully with ${this.isDarkTheme ? 'dark' : 'light'} theme`);

        } catch (error) {
            console.error('Error initializing map:', error);
            throw error;
        }
    }

    createLayers() {
        // Check if clustering is enabled to determine layer type
        const clusteringConfig = this.config?.clustering;
        const shouldCluster = clusteringConfig?.enabled || this.config?.features?.enableClustering;

        if (shouldCluster) {
            // Use FeatureLayer for clustering support
            this.fiberLayer = new FeatureLayer({
                title: 'Fiber Offline',
                listMode: 'hide',
                source: [], // Start with empty source
                fields: [
                    {
                        name: 'ObjectID',
                        alias: 'ObjectID',
                        type: 'oid'
                    },
                    {
                        name: 'id',
                        alias: 'ID',
                        type: 'string'
                    },
                    {
                        name: 'status',
                        alias: 'Status',
                        type: 'string'
                    },
                    {
                        name: 'city',
                        alias: 'City',
                        type: 'string'
                    },
                    {
                        name: 'state',
                        alias: 'State',
                        type: 'string'
                    },
                    {
                        name: 'serviceType',
                        alias: 'Service Type',
                        type: 'string'
                    },
                    {
                        name: 'last_update',
                        alias: 'Last Updated',
                        type: 'string'
                    }
                ],
                objectIdField: 'ObjectID',
                geometryType: 'point',
                spatialReference: { wkid: 4326 },
                renderer: {
                    type: 'simple',
                    symbol: {
                        type: 'simple-marker',
                        style: 'circle',
                        color: [220, 38, 38, 0.8],
                        size: 8,
                        outline: {
                            color: [255, 255, 255],
                            width: 1
                        }
                    }
                },
                popupTemplate: {
                    title: 'Service Area Interruption',
                    content: [
                        {
                            type: 'fields',
                            fieldInfos: [
                                { fieldName: 'status', label: 'Status' },
                                { fieldName: 'city', label: 'City' },
                                { fieldName: 'state', label: 'State' },
                                { fieldName: 'serviceType', label: 'Service Type' },
                                { fieldName: 'last_update', label: 'Last Updated' }
                            ]
                        }
                    ]
                }
            });

            this.electricLayer = new FeatureLayer({
                title: 'Electric Outages',
                listMode: 'hide',
                source: [],
                fields: [
                    {
                        name: 'ObjectID',
                        alias: 'ObjectID',
                        type: 'oid'
                    },
                    {
                        name: 'id',
                        alias: 'ID',
                        type: 'string'
                    },
                    {
                        name: 'status',
                        alias: 'Status',
                        type: 'string'
                    },
                    {
                        name: 'serviceType',
                        alias: 'Service Type',
                        type: 'string'
                    },
                    {
                        name: 'area',
                        alias: 'Service Area',
                        type: 'string'
                    }
                ],
                objectIdField: 'ObjectID',
                geometryType: 'point',
                spatialReference: { wkid: 4326 },
                renderer: {
                    type: 'simple',
                    symbol: {
                        type: 'simple-marker',
                        style: 'circle',
                        color: [255, 140, 0, 0.8],
                        size: 8,
                        outline: {
                            color: [255, 255, 255],
                            width: 1
                        }
                    }
                },
                popupTemplate: {
                    title: 'Power Service Area',
                    content: [
                        {
                            type: 'fields',
                            fieldInfos: [
                                { fieldName: 'status', label: 'Status' },
                                { fieldName: 'serviceType', label: 'Service Type' },
                                { fieldName: 'area', label: 'Service Area' }
                            ]
                        }
                    ]
                }
            });
        } else {
            // Use GraphicsLayer for non-clustering tenants
            this.fiberLayer = new GraphicsLayer({
                title: 'Fiber Offline',
                listMode: 'hide'
            });

            this.electricLayer = new GraphicsLayer({
                title: 'Electric Outages',
                listMode: 'hide'
            });
        }

        // Add layers to map first
        this.map.addMany([this.fiberLayer, this.electricLayer]);

        // Add clustering to both layers after they're added to map
        this.setupClustering();
    }

    setupClustering() {
        // Check if tenant has clustering enabled
        const clusteringConfig = this.config?.clustering;
        const shouldCluster = clusteringConfig?.enabled || this.config?.features?.enableClustering;

        if (!shouldCluster) {
            console.log('Clustering disabled for this tenant');
            return;
        }

        // Get clustering settings from tenant config
        const radius = clusteringConfig?.radius || 35;
        const minSize = clusteringConfig?.minSize || 16;
        const maxSize = clusteringConfig?.maxSize || 40;
        const privacyMode = clusteringConfig?.privacyMode || false;

        console.log(`Clustering enabled for ${this.config.tenant.name}: radius=${radius}, privacy=${privacyMode}`);

        // Apply clustering to FeatureLayers
        if (this.fiberLayer.type === 'feature') {
            this.fiberLayer.featureReduction = {
                type: 'cluster',
                clusterRadius: radius,
                clusterMinSize: minSize,
                clusterMaxSize: maxSize,
                symbol: {
                    type: 'simple-marker',
                    style: 'circle',
                    color: [220, 38, 38, 0.9],
                    size: Math.max(minSize + 10, 30),
                    outline: {
                        color: [255, 255, 255],
                        width: 2
                    }
                },
                labelingInfo: [{
                    deconflictionStrategy: 'none',
                    labelExpressionInfo: {
                        expression: '$feature.cluster_count'
                    },
                    symbol: {
                        type: 'text',
                        color: 'white',
                        font: {
                            family: 'Arial Unicode MS',
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    labelPlacement: 'center-center'
                }],
                popupTemplate: {
                    title: privacyMode ? 'Service Area' : 'Service Interruptions',
                    content: privacyMode ?
                        '{cluster_count} service interruptions in this area' :
                        '{cluster_count} service interruptions'
                }
            };

            console.log('✅ Fiber layer clustering configured for FeatureLayer');
        }

        if (this.electricLayer.type === 'feature') {
            this.electricLayer.featureReduction = {
                type: 'cluster',
                clusterRadius: radius,
                clusterMinSize: minSize,
                clusterMaxSize: maxSize,
                symbol: {
                    type: 'simple-marker',
                    style: 'circle',
                    color: [255, 140, 0, 0.9],
                    size: Math.max(minSize + 10, 30),
                    outline: {
                        color: [255, 255, 255],
                        width: 2
                    }
                },
                labelingInfo: [{
                    deconflictionStrategy: 'none',
                    labelExpressionInfo: {
                        expression: '$feature.cluster_count'
                    },
                    symbol: {
                        type: 'text',
                        color: 'white',
                        font: {
                            family: 'Arial Unicode MS',
                            size: 14,
                            weight: 'bold'
                        }
                    },
                    labelPlacement: 'center-center'
                }],
                popupTemplate: {
                    title: privacyMode ? 'Power Service Area' : 'Power Outages',
                    content: privacyMode ?
                        '{cluster_count} power outages in this area' :
                        '{cluster_count} power outages'
                }
            };

            console.log('✅ Electric layer clustering configured for FeatureLayer');
        }
    }

    setupWidgets() {
        // Search widget
        this.searchWidget = new Search({
            view: this.view,
            container: 'search-container',
            allPlaceholder: 'Search for a location',
            includeDefaultSources: true,
            locationEnabled: true,
            searchAllEnabled: false,
            suggestionsEnabled: true,
            minSuggestCharacters: 2
        });

        // Locate widget (programmatically controlled)
        this.locateWidget = new Locate({
            view: this.view
        });

        // Constrain search to bounds
        this.searchWidget.viewModel.sources.forEach(source => {
            if (source.name === 'ArcGIS World Geocoding Service') {
                source.filter = {
                    geometry: this.bounds
                };
            }
        });
    }

    async updateFiberLayer(data) {
        try {
            const clusteringConfig = this.config?.clustering;
            const shouldCluster = clusteringConfig?.enabled || this.config?.features?.enableClustering;

            if (shouldCluster && this.fiberLayer.type === 'feature') {
                // FeatureLayer approach for clustering - use applyEdits
                const features = data.map((item, index) => {
                    const point = new Point({
                        longitude: item.longitude,
                        latitude: item.latitude
                    });

                    return new Graphic({
                        geometry: point,
                        attributes: {
                            ObjectID: index + 1,
                            id: item.id,
                            status: item.status || 'Offline',
                            city: item.city || 'Service Area',
                            state: item.state || 'AL',
                            serviceType: item.serviceType || item.service_type || 'Fiber',
                            last_update: item.last_update || item.updated_at || item.created_at || 'N/A'
                        }
                    });
                });

                // Use applyEdits to update FeatureLayer
                const result = await this.fiberLayer.applyEdits({
                    deleteFeatures: this.fiberLayer.source.toArray(), // Remove existing
                    addFeatures: features // Add new features
                });
                console.log(`✅ Updated FeatureLayer with ${features.length} features for clustering`);
                console.log('ApplyEdits result:', result);
            } else {
                // GraphicsLayer approach (existing logic)
                this.fiberLayer.removeAll();

                const graphics = data.map(item => {
                    const point = new Point({
                        longitude: item.longitude,
                        latitude: item.latitude
                    });

                    const symbol = new SimpleMarkerSymbol({
                        color: [255, 0, 0, 0.8],
                        size: 8,
                        outline: {
                            color: [255, 255, 255],
                            width: 1
                        }
                    });

                    const popup = new PopupTemplate({
                        title: 'Service Area Interruption',
                        content: [
                            {
                                type: 'fields',
                                fieldInfos: [
                                    { fieldName: 'status', label: 'Status' },
                                    { fieldName: 'city', label: 'City' },
                                    { fieldName: 'state', label: 'State' },
                                    { fieldName: 'serviceType', label: 'Service Type' },
                                    { fieldName: 'last_update', label: 'Last Updated' }
                                ]
                            }
                        ]
                    });

                    return new Graphic({
                        geometry: point,
                        symbol: symbol,
                        attributes: {
                            id: item.id,
                            status: item.status || 'Offline',
                            city: item.city || 'Service Area',
                            state: item.state || 'AL',
                            serviceType: item.serviceType || item.service_type || 'Fiber',
                            last_update: item.last_update || item.updated_at || item.created_at || 'N/A'
                        },
                        popupTemplate: popup
                    });
                });

                this.fiberLayer.addMany(graphics);
                console.log(`Updated GraphicsLayer with ${graphics.length} graphics`);
            }

        } catch (error) {
            console.error('Error updating fiber layer:', error);
        }
    }

    async updateElectricLayer(data) {
        try {
            const clusteringConfig = this.config?.clustering;
            const shouldCluster = clusteringConfig?.enabled || this.config?.features?.enableClustering;

            if (shouldCluster && this.electricLayer.type === 'feature') {
                // FeatureLayer approach for clustering - use applyEdits
                const features = data.map((item, index) => {
                    const point = new Point({
                        longitude: item.longitude,
                        latitude: item.latitude
                    });

                    return new Graphic({
                        geometry: point,
                        attributes: {
                            ObjectID: index + 1,
                            id: item.id,
                            status: item.status || 'Offline',
                            serviceType: item.type || 'Electric',
                            area: item.city || item.area || 'Service Area'
                        }
                    });
                });

                // Use applyEdits to update FeatureLayer
                const result = await this.electricLayer.applyEdits({
                    deleteFeatures: this.electricLayer.source.toArray(), // Remove existing
                    addFeatures: features // Add new features
                });
                console.log(`✅ Updated Electric FeatureLayer with ${features.length} features for clustering`);
                console.log('Electric ApplyEdits result:', result);
            } else {
                // GraphicsLayer approach (existing logic)
                this.electricLayer.removeAll();

                const graphics = data.map(item => {
                    const point = new Point({
                        longitude: item.longitude,
                        latitude: item.latitude
                    });

                    const symbol = new SimpleMarkerSymbol({
                        color: [255, 140, 0, 0.8],
                        size: 8,
                        outline: {
                            color: [255, 255, 255],
                            width: 1
                        }
                    });

                    const popup = new PopupTemplate({
                        title: 'Power Service Area',
                        content: [
                            {
                                type: 'fields',
                                fieldInfos: [
                                    { fieldName: 'status', label: 'Status' },
                                    { fieldName: 'serviceType', label: 'Service Type' },
                                    { fieldName: 'area', label: 'Service Area' }
                                ]
                            }
                        ]
                    });

                    return new Graphic({
                        geometry: point,
                        symbol: symbol,
                        attributes: {
                            id: item.id,
                            status: item.status || 'Offline',
                            serviceType: item.type || 'Electric',
                            area: item.city || item.area || 'Service Area',
                            created_at: item.created_at
                        },
                        popupTemplate: popup
                    });
                });

                this.electricLayer.addMany(graphics);
                console.log(`Updated Electric GraphicsLayer with ${graphics.length} graphics`);
            }

        } catch (error) {
            console.error('Error updating electric layer:', error);
        }
    }

    toggleLayer(layerType, visible) {
        const layer = layerType === 'fiber' ? this.fiberLayer : this.electricLayer;
        if (layer) {
            layer.visible = visible;
        }
    }

    changeBasemap(basemapId) {
        if (this.map) {
            this.map.basemap = basemapId;
        }
    }

    goHome() {
        if (this.view) {
            this.view.goTo({
                target: this.bounds,
                duration: 1000
            });
        }
    }

    locateUser() {
        if (this.locateWidget) {
            this.locateWidget.locate();
        }
    }

    resize() {
        if (this.view && this.view.resize) {
            try {
                this.view.resize();
            } catch (error) {
                // Fallback: trigger a manual resize by updating container size
                if (this.view.container) {
                    this.view.container.style.width = this.view.container.offsetWidth + 'px';
                    this.view.container.style.height = this.view.container.offsetHeight + 'px';
                }
            }
        }
    }

    detectDarkTheme() {
        // Check for dark theme preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return true;
        }

        // Check for calcite-mode-dark class on document
        if (document.documentElement.classList.contains('calcite-mode-dark')) {
            return true;
        }

        return false;
    }

    getBasemapForTheme() {
        const mapConfig = this.config?.map || {};

        if (this.isDarkTheme) {
            return mapConfig.basemapDark || mapConfig.basemap || 'dark-gray-vector';
        } else {
            return mapConfig.basemapLight || mapConfig.basemap || 'streets-navigation-vector';
        }
    }

    setupThemeMonitoring() {
        // Listen for system theme changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addListener(() => {
                this.updateTheme();
            });
        }

        // Listen for manual theme changes on document
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (mutation.target.classList.contains('calcite-mode-dark') !== this.isDarkTheme) {
                        this.updateTheme();
                    }
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class']
        });
    }

    updateTheme() {
        this.isDarkTheme = this.detectDarkTheme();

        if (this.map) {
            const newBasemap = this.getBasemapForTheme();
            this.map.basemap = newBasemap;
        }

        // Apply theme to ArcGIS widgets following cursor rules
        if (this.view && this.view.ui) {
            const widgets = this.view.ui.components;
            widgets.forEach(widget => {
                if (widget.container && widget.container.classList) {
                    if (this.isDarkTheme) {
                        widget.container.classList.add('calcite-mode-dark');
                    } else {
                        widget.container.classList.remove('calcite-mode-dark');
                    }
                }
            });
        }

        console.log(`Theme updated: ${this.isDarkTheme ? 'dark' : 'light'} mode`);
    }

    destroy() {
        if (this.view) {
            this.view.destroy();
        }
    }
}