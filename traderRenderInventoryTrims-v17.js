(function () {
    /* Configuration and QA */

    let params = new URLSearchParams(window.location.search);

    let lang;
    if (params.get('qa') === 'true' && params.get('lang')) {
        lang = params.get('lang');
    } else {
        lang = document.documentElement.lang;
    }

    let manufacturer;
    if (params.get('qa') === 'true' && params.get('manufacturer')) {
        manufacturer = params.get('manufacturer');
    } else {
        const metaTag = document.querySelector('meta[name="manufacturer"]');
        manufacturer = metaTag ? metaTag.getAttribute('content') : '';
    }

    let modelOverride;
    if (params.get('qa') === 'true' && params.get('model')) {
        modelOverride = params.get('model');
    } else {
        const metaTag = document.querySelector('meta[name="model"]');
        modelOverride = metaTag ? metaTag.getAttribute('content') : '';
    }

    if (params.get('qa') === 'true') {
        console.log('QA mode is activated - API requests are soruced from the "' + lang + '" language. The manufacturer has been set to "' + manufacturer + '".');
    }

    /* Inventory */

    document.addEventListener('DOMContentLoaded', () => {

        let cards = document.querySelectorAll('[data-at-card]');

        if (cards.length > 0) {

            const manufacturerMeta = manufacturer;
            const modelMeta = modelOverride;
            const modelMinYear = document.querySelector('meta[name="modelYear"]');
            let url = '';

            if (params.get('qa') === 'true' && lang === 'fr') {
                url = `https://apimqa.autohebdo.net/research/v1/vehicle-inventory?make=`;
            } else if (params.get('qa') === 'true') {
                url = `https://apimqa.autotrader.ca/research/v1/vehicle-inventory?make=`;
            } else if (lang === 'fr') {
                url = `https://apimktprd01.autohebdo.net/research/v1/vehicle-inventory?make=`;
            } else {
                url = `https://apimktprd01.autotrader.ca/research/v1/vehicle-inventory?make=`;
            }

            if (manufacturerMeta) {
                url += manufacturerMeta;
            }
            if (modelMeta) {
                url += '&model=' + modelMeta;
            }
            if (modelMinYear) {
                url += '&minYear=' + modelMinYear.getAttribute('content');
            }


            fetch(url, { credentials: 'include' })
                .then(response => response.json())
                .then(data => {
                    document.body.removeAttribute('data-skeleton');

                    // If there are more cards than vehicles, remove the extra cards
                    if (cards.length > data.vehicles.length) {
                        for (let i = data.vehicles.length; i < cards.length; i++) {
                            cards[i].remove();
                        }
                    }

                    // Update href of all elements with 'data-at-inventory-url' attribute
                    const inventoryUrlElements = document.querySelectorAll('[data-at-inventory-url]');
                    inventoryUrlElements.forEach(element => {
                        element.href = data.searchUrl;
                    });

                    // Update the cards NodeList to reflect the removed cards
                    cards = document.querySelectorAll('[data-at-card]');

                    cards.forEach((card, index) => {
                        const vehicle = data.vehicles[index];
                        if (vehicle) {

                            card.setAttribute('data-an-position', index + 1);

                            for (let key in vehicle) {
                                if (typeof vehicle[key] === 'object' && vehicle[key] !== null) {
                                    // If the value is an object, add data attributes for each key in the object
                                    for (let subKey in vehicle[key]) {
                                        card.setAttribute(`data-an-${key}-${subKey}`, vehicle[key][subKey]);
                                    }
                                } else {
                                    card.setAttribute(`data-an-${key}`, vehicle[key]);
                                }
                            }

                            const textElements = card.querySelectorAll('[data-at-text]');
                            textElements.forEach(el => {
                                const key = el.getAttribute('data-at-text');
                                const keys = key.split('-');
                                let value = vehicle;
                                keys.forEach(k => {
                                    value = value[k];
                                });

                                if (key === 'price') {
                                    if (lang === 'fr') {

                                        value = new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
                                    } else { 

                                        value = new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);                           
                                
                                    }

                                }



                                if (key === 'distance') {

                                    if (lang === 'fr') {

                                        value = `À ${value} km de vous`

                                    } else {
                                        value = `${value} km from you`;

                                    }

                                }

                                el.innerHTML = value;
                            });

                            const imageElements = card.querySelectorAll('[data-at-image]');
                            imageElements.forEach(el => {
                                const key = el.getAttribute('data-at-image');
                                const keys = key.split('-');
                                let value = vehicle;
                                keys.forEach(k => {
                                    value = value[k];
                                });
                                if (value) {
                                    el.src = value;
                                }
                            });

                            const linkElements = card.querySelectorAll('[data-at-link]');
                            linkElements.forEach(el => {
                                const key = el.getAttribute('data-at-link');
                                el.href = vehicle[key];
                            });
                        }
                    });

                }).then(() => {

                    // Apply data pushes to rendered inventory. 

                    let items = [];

                    let cards = document.querySelectorAll('[data-at-card]');

                    cards.forEach((parent, index) => {
                        let item = {
                            'item_id': '',
                            'item_name': '',
                            'listingPosition': 'organic',
                            'price': '',
                            'item_brand': '',
                            'item_category': 'not used',
                            'quantity': '1',
                            'ad_id': '',
                            'ad_make': '<MAKE>',
                            'ad_model': '<MODEL>',
                            'ad_province': '<PROVINCE>',
                            'ad_year': '<YEAR>',
                            'ad_dealer_id': '',
                            'raw_location': '',
                            'ad_position': 'organic',
                            'ad_active_upsells': 'organic',
                            'ad_upgrades_applied': 'not used',
                            'positions': ''
                        };

                        let itemMapping = {
                            'item_id': 'trackingid',
                            'item_name': 'model', // add brand and model
                            'item_brand': 'dealer-trackingid',
                            'ad_dealer_id': 'dealer-trackingid',
                            'price': 'price',
                            'quantity': '1',
                            'ad_id': 'trackingid',
                            'ad_make': 'make',
                            'ad_model': 'model',
                            'ad_province': 'province',
                            'ad_year': 'year',
                            'ad_position': 'ad-position',
                            'positions': 'position'

                        };

                        for (let key in item) {
                            let attrName = 'data-an-' + itemMapping[key];
                            let attr = parent.getAttribute(attrName);

                            if (attr !== null) {
                                if (key === 'item_name') {
                                    var metaContent = document.querySelector('meta[name="manufacturer"]').content;
                                    item[key] = metaContent + ' | ' + attr;
                                } else {
                                    item[key] = attr;
                                }
                            }
                        }

                        items.push(item);
                    });

                    let vehicle = [];

                    cards.forEach((parent) => {
                        let item = {
                            'adID': '<AD ID>',
                            'upgradesApplied': 'not used',
                            'dealerID': 'trackingid',
                            'listingPosition': 'organic',
                            'make': '<MAKE>',
                            'model': '<MODEL>',
                            'price': '<PRICE>',
                            'province': '<PROVINCE>',
                            'rawLocation': '',
                            'year': '<YEAR>'
                        };

                        let itemMapping = {
                            'adID': 'trackingid',
                            'dealerID': 'dealer-trackingid',
                            'make': 'make',
                            'model': 'model',
                            'price': 'price',
                            'province': 'province',
                            'year': 'year'
                        };

                        for (let key in item) {
                            let attrName = 'data-an-' + itemMapping[key];
                            let attr = parent.getAttribute(attrName);

                            if (attr !== null) {
                                if (key === 'item_name') {
                                    var metaContent = document.querySelector('meta[name="manufacturer"]').content;
                                    item[key] = metaContent + ' | ' + attr;
                                } else {
                                    item[key] = attr;
                                }
                            }
                        }

                        vehicle.push(item);
                    });

                    function generateDataPush(items, type, vehicle) {
                        let elementTitle = document.querySelector('[data-push-title]');

                        let dataPush = {
                            'event': type,
                            'listKey': elementTitle.textContent.replace(/\n/g, ' ').trim(),
                            'ecommerce': { 'item_list_name': 'storefront - ' + elementTitle.textContent.replace(/\n/g, ' ').trim(), items }
                        };

                        if (vehicle != null) {
                            dataPush['vehicle'] = vehicle;
                        }

                        return dataPush;
                    }

                    let dataPush = generateDataPush(items, 'view_item_list');

                    dataLayer.push(dataPush);

                    function handleClick(event) {
                        let link = event.target.closest('a');
                        let parentElement = link.parentNode;
                        let index = Array.from(parentElement.parentNode.children).indexOf(parentElement);

                        let dataPush = generateDataPush([items[index]], 'select_item', vehicle[index]);

                        dataLayer.push(dataPush);
                    }

                    cards.forEach((card) => {
                        card.addEventListener('click', handleClick);
                    });

                });

        }

    });

    /* Trims Translations */

    const mapping =
    {
        "360 Camera": "Caméra à 360°",
        "Adaptive Cruise Control": "Régulateur de vitesse adaptatif",
        "Add Vehicle": "Ajouter véhicule",
        "Air Conditioning": "Climatiseur",
        "All Features": "Toutes les caractéristiques",
        "AM/FM Stereo": "AM/FM Stéréo",
        "Android Auto": "Android Auto",
        "Apple CarPlay": "Apple CarPlay",
        "Auto-Dimming Rearview Mirror": "Rétroviseur à atténuation automatique",
        "Automatic Headlights": "Phares automatiques",
        "Automatic Parking": "Stationnement automatique",
        "AutoTrader Review": "Avis AutoHebdo",
        "Auxiliary Audio Input": "Prise audio auxiliaire",
        "Back-Up Camera": "Caméra de recul",
        "Base Curb Weight": "Poids à vide ",
        "Based on": "Selon",
        "Battery Range": "Portée batterie (km)",
        "Bed Liner": "Doublure de caisse",
        "Blind Spot Monitor": "Surveillance de l’angle mort",
        "Bluetooth Connection": "Interface Bluetooth",
        "Brake": "Freins",
        "Brake ABS System": "Freinage ABS",
        "Brake Assist": "Freinage assisté",
        "Buyer’s Guide": "Guide d’achat",
        "Canadian MSRP": "PDSF",
        "MSRP": "PDSF",
        "Canopy": "Toit amovible",
        "Car Comparison": "Comparatif de véhicules",
        "Cargo Volume ": "Volume cargo ",
        "Cargo Volume to First Row": "Volume cargo 1re rangée ",
        "Cargo Volume to Second Row": "Volume cargo 2e rangée ",
        "Cargo Volume to Third Row": "Volume cargo 3e rangée ",
        "CD Player": "Lecteur CD",
        "Change Vehicle": "Changer véhicule",
        "Child Safety Locks": "Verrous de sécurité pour enfants",
        "Climate Control": "Climatisation automatique",
        "Comfort": "Confort",
        "Compare": "Comparer",
        "Compare Cars Side by Side": "Comparatif de modèles côte à côte",
        "Compare Trims": "Comparer les versions",
        "Want to see which vehicle is better? Use our Vehicle Comparison Tool and see their price, specs and features side by side.": "Vous n’avez pas encore trouvé le modèle qui vous convient le mieux? Utilisez notre outil comparatif pour afficher les prix, données techniques et autres caractéristiques en côte à côte.",
        "Comparison": "Comparaison",
        "Compare prices, trims, specs, options, features and scores of up to five cars, trucks or SUVs that are available in Canada with our free side-by-side car comparison tool.": "Compare les prix, versions, données techniques, options, caractéristiques et cotes d’un maximum de cinq voitures, camions ou VUS offerts au Canada avec notre outil gratuit de comparaison en face à face.",
        "Connectivity": "Connectivité",
        "Convenience": "Commodité",
        "Cooled Front Seat(s)": "Sièges avant ventilés",
        "Cooled Rear Seat(s)": "Sièges arrière ventilés",
        "Cross-Traffic Alert": "Alerte de circulation transversale",
        "Cruise Control": "Régulateur de vitesse",
        "Data provided by": "Données fournies par",
        "Daytime Running Lights": "Feux de jour",
        "Dead Weight Hitch - Max Tongue Wt.": "Cap. de remorquage, attelage - Poids max. au timon",
        "Dead Weight Hitch - Max Trailer Wt.": "Cap. de remorquage, attelage - Charge utile max.",
        "Differences": "Différences",
        "Displacement": "Cylindrée",
        "DriverAssistance": "Aide à la conduite",
        "Driver Assistance": "Aide à la conduite",
        "Driver Adjustable Lumbar": "Ajustement lombaire conducteur",
        "Driver Air Bag": "Coussin gonflable conducteur",
        "Driver Restriction Features": "Restrictions de conduite",
        "Drivetrain": "Entraînement",
        "Emergency Trunk Release": "Ouverture d’urgence du coffre",
        "Engine": "Moteur",
        "Engine Immobilizer": "Antidémarreur",
        "Explore": "Années-modèles",
        "Exterior": "Extérieur",
        "Exterior Styling": "Style extérieur",
        "Fifth Wheel Hitch - Max Tongue Wt.": "Attelage à sellette - Poids max. au timon",
        "Fifth Wheel Hitch - Max Trailer Wt.": "Attelage à sellette - Charge utile max.",
        "for Sale": "à vendre",
        "Front Head Air Bag": "Coussin gonflable avant",
        "Front Head Room": "Dégagement tête, avant ",
        "Front Leg Room": "Dégagement genoux, avant ",
        "Front Reading Lamps": "Lampes de lecture avant",
        "Front Shoulder Room": "Dégagement épaules, avant ",
        "Front Side Air Bag": "Coussins gonflables latéraux avant",
        "Front Tire Size": "Pneus avant",
        "Fuel": "Carburant",
        "Fuel Capacity": "Cap. carburant (L)",
        "Fuel Consumption: City": "Consom. carburant: Ville",
        "Fuel Consumption: City/HWY Combined": "Consom. carburant: Combiné",
        "Fuel Consumption: Equivalent - City": "Consom. carburant: Équivalent - Ville",
        "Fuel Consumption: Equivalent - City/HWY Combined": "Consom. carburant: Équivalent - Combiné",
        "Fuel Consumption: Equivalent - Highway": "Consom. carburant: Équivalent - Autoroute",
        "Fuel Consumption: Highway": "Consom. carburant: Autoroute",
        "Fuel Economy": "Économie de carburant",
        "Fuel System": "Système d’alimentation",
        "Hands-Free Liftgate": "Hayon motorisé main libre",
        "Hard Disk Drive Media Storage": "Disque dur stockage média",
        "HD Radio": "Radio HD",
        "Headlights-Auto-Leveling": "Phares à nivellement automatique",
        "Heads-Up Display": "Affichage tête haute",
        "Head to Head Comparisons": "Comparatif face-à-face",
        "Heated Front Seat(s)": "Sièges avant chauffants",
        "Heated Mirrors": "Miroirs chauffants",
        "Heated Rear Seat(s)": "Sièges arrière chauffants",
        "Heated Steering Wheel": "Volant chauffant",
        "Height, Overall": "Hauteur hors-tout ",
        "HID headlights": "Phares HID",
        "Horsepower": "Puissance",
        "Infotainment": "Infodivertissement",
        "Integrated Turn Signal Mirrors": "Miroirs à feux clignotants intégrés",
        "Interior": "Intérieur",
        "Interior Design": "Commodité intérieure",
        "Inventory": "Inventaire",
        "Keyless Entry": "Télédéverrouillage",
        "Keyless Start": "Démarrage sans clé",
        "Key Specifications for": "Principales caractéristiques:",
        "Knee Air Bag": "Coussin gonflable aux genoux",
        "Lane Departure Warning": "Avertisseur de dérive",
        "Lane Keeping Assist": "Aide au maintien dans la voie",
        "Latest Automotive Articles": "Plus récents articles automobiles",
        "Latest Convertibles": "Plus récentes décapotables",
        "Latest Coupes": "Coupés neufs",
        "Latest Hatchbacks": "Véhicules à hayon",
        "Latest Minivans": "Minifourgonnettes neuves",
        "Latest Sedans": "Berlines neuves",
        "Latest SUVs": "VUS neufs",
        "Latest Trucks": "Camions neufs",
        "Latest and Upcoming Vehicles": "Véhicules récents et non dévoilés",
        "Latest Vehicles": "Plus récents véhicules",
        "Latest Wagons": "Familiales neuves",
        "Length, Overall": "Longueur hors-tout ",
        "Less Makes": "Moins de marques",
        "Lighting": "Éclairage",
        "Luggage Rack": "Porte-bagages",
        "Make": "Marque",
        "Manufacturer Recall Number": "Numéro de rappel du fabricant",
        "Maximum Trailering Capacity": "Capacité de remorque max.",
        "Mechanical": "Mécanique",
        "Min Ground Clearance": "Garde au sol ",
        "Mirror Memory": "Miroir à mémoire",
        "Model": "Modèle",
        "Model year(s) affected": "Année-modèle touchée",
        "Model Overview": "Aperçu du modèle",
        "Models": "Modèles",
        "More Makes": "Plus de marques",
        "Most Popular Comparisons": "Plus populaires comparatifs",
        "MP3 Player": "Lecteur MP3",
        "Multi-Zone Air Conditioning": "Climatiseur multizone",
        "N/A": "s.o.",
        "Navigation System": "Système de navigation",
        "News and Reviews": "Nouvelles et Revues",
        "Frequently Asked Questions About the": "Foire Aux Questions Sur la",
        "Night Vision": "Système de vision nocturne",
        "No content available": "Aucun contenu disponible",
        "No deals currently available for this location.": "Présentement aucune offre pour cet emplacement.",
        "There is no record of recalls for the": "Aucun rappel trouvé pour",
        "Not Available": "Non offert",
        "Notification Type": "Type de notification",
        "Optional": "En option",
        "Overall Score": "Note globale",
        "Owner Reviews": "Évaluations de propriétaires",
        "Owner Scores": "Avis des proprios",
        "Passenger Adjustable Lumbar": "Ajustement lombaire passager",
        "Passenger Air Bag": "Coussin gonflable passager",
        "Passenger Capacity": "Nb. de passagers",
        "Pickup Bed Tonneau Cover": "Couvercle de caisse rigide",
        "Power Door Locks": "Verrouillage électrique",
        "Power Driver Seat": "Siège motorisé conducteur",
        "Power Folding Mirrors": "Miroirs escamotables",
        "Power Liftgate": "Hayon motorisé",
        "Power Mirror(s)": "Miroirs électriques",
        "Power Outlet": "Prise de courant",
        "Power Passenger Seat": "Siège motorisé passager",
        "Power Retractable Running Boards": "Marchepieds motorisés rétractables",
        "Power Windows": "Vitres électriques",
        "Cars": "Automobiles",
        "Compare Vehicles": "Comparer véhicules",
        "Convertibles": "Décapotables",
        "Coupes": "Coupés",
        "Hatchbacks": "Véhicules à hayon",
        "Already have a model in mind? Dive in and see information on trims, prices, specs, options and more!": "Vous avez déjà un modèle en tête? Sélectionnez-le ci-dessous pour découvrir les versions, prix, données techniques, options et plus!",
        "Home": "Accueil",
        "Luxury Sedans": "Berlines de luxe",
        "Luxury SUVs": "VUS de luxe",
        "Minivans": "Minifourgonnettes",
        "Sedans": "Berlines",
        "SUVs": "VUS",
        "Trucks": "Camions",
        "Wagons": "Familiales",
        "Rain Sensing Wipers": "Essuie-glace automatiques",
        "Read less": "Lire moins",
        "Read more": "Lire plus",
        "Rear Air Conditioning": "Climatisation à l’arrière",
        "Rear Head Air Bag": "Coussin gonflable arrière",
        "Rear Head Room": "Dégagement tête, arrière ",
        "Rear Leg Room": "Dégagement genoux, arrière ",
        "Rear Parking Aid": "Aide au stationnement arrière",
        "Rear Reading Lamps": "Lampes de lecture arrière",
        "Rear Seat Audio Controls": "Commandes audio aux sièges arrière",
        "Rear Shoulder Room": "Dégagement épaules, arrière ",
        "Rear Side Air Bag": "Coussins gonflables latéraux arrière",
        "Rear Tire Size": "Pneus arrière",
        "Recall date": "Date de rappel",
        "Recall Information": "Rappels",
        "Recall number": "N° de rappel",
        "Reliability": "Fiabilité",
        "Remote Engine Start": "Démarreur à distance",
        "Remote Trunk Release": "Couvercle de coffre télécommandé",
        "Research": "Rechercher",
        "Research By Make": "Recherche par marque",
        "reviews": "avis",
        "Reviews & News": "Revues et nouvelles",
        "Rollover Protection Bars": "Barres de protection antiroulis",
        "Roof": "Toit",
        "Running Boards/Side Steps": "Marchepieds",
        "Safety": "Sécurité",
        "Satellite Radio": "Radio satellite",
        "Search now": "Rechercher maintenant",
        "Seat-Massage": "Sièges à massage",
        "Seatbelt Air Bag": "Coussin gonflable de ceinture",
        "Seat Memory": "Mémoire de siège",
        "Seats": "Sièges",
        "Security": "Sécurité",
        "Security System": "Système de sécurité",
        "Select Another Vehicle": "Sélectionner autre véhicule",
        "Select A Vehicle": "Sélectionner un véhicule",
        "Similar Vehicles": "Véhicules similaires",
        "Smart Device Integration": "Intégration appareils intelligents",
        "Stability Control": "Contrôle de stabilité",
        "Standard": "De série",
        "Steering": "Direction",
        "Steering Wheel-Audio Controls": "Commandes de la radio au volant",
        "Stepside Pickup Box": "Caisse stepside",
        "Sun/Moon Roof": "Toit soleil/lune",
        "System affected": "Système touché",
        "Third Row Head Room": "Dégagement tête, 3e rangée ",
        "Third Row Leg Room": "Dégagement genoux, 3e rangée ",
        "Third Row Shoulder Room": "Dégagement épaules, 3e rangée ",
        "Tire Pressure Monitor": "Surv. pression des pneus",
        "Torque": "Couple",
        "Traction Control": "Système antipatinage",
        "Trader Scores": "Cotes AutoHebdo",
        "Transmission": "Transmission",
        "Transport Canada": "Transports Canada",
        "Trim Comparison": "Comparatif de versions",
        "Trim (Optional)": "Version (En option)",
        "Trunk Volume": "Volume coffre",
        "Units Affected": "Unités affectées",
        "Universal Garage Door Opener": "Ouvre-porte de garage universel",
        "Upcoming": "À venir",
        "Variable Speed Intermittent Wipers": "Essuie-glaces intermittents",
        "Vehicle Information": "Renseignements sur le véhicule",
        "This vehicle has not yet been reviewed": "Soyez le premier à donner votre avis!",
        "Vehicle Research": "Rechercher véhicule",
        "View all": "Voir toutes les",
        "View All Articles": "Tous les articles",
        "View all owner reviews": "Voir tous les avis de propriétaires",
        "View Deals": "Voir les offres",
        "View details": "Afficher détails",
        "View Inventory": "Voir inventaire",
        "View Issue": "Voir le problème",
        "View less recalls": "Afficher moins de rappels",
        "View more recalls": "Voir plus de rappels",
        "Wheelbase": "Empattement",
        "Wheels-Locks": "Écrous de roues de sécurité",
        "Width, Max w/o mirrors": "Largeur, sans rétroviseurs ",
        "WiFi Hotspot": "Point d’accès Wi-Fi",
        "Wireless Charging": "Recharge sans fil",
        "Wt Distributing Hitch - Max Tongue Wt.": "Attelage à redistribution - Poids max. au timon",
        "Wt Distributing Hitch - Max Trailer Wt.": "Attelage à redistribution - Charge utile max.",
        "Year": "Année",
        "Showing {0} of {1} trims": "{0} de {1} versions",
        "News": "Nouvelles",
        "Review": "Revue",
        "No model overview available": "Aucun aperçu du modèle disponible",
        "Cargo Volume with Rear Seat Down": "Volume cargo, sièges arrière abaissés",
        "Cargo Volume with Rear Seat Up": "Volume cargo, sièges arrière levés",
        "Reviews and News": "Revues et nouvelles",
        "No": "Non",
        "Yes": "Oui",
        "4 Wheel Disc": "Disque aux 4 roues",
        "4 Wheel Drum": "Tambour aux 4 roues",
        "All-wheel": "4RM",
        "Flex Fuel": "Flex Fuel",
        "for": "pour",
        "Front-wheel": "Roues avant",
        "Front Disc Rear Drum": "Disques avant/tambours arr.",
        "Gasoline": "Essence",
        "Gasoline direct injection": "Injection directe d'essence",
        "Hydrogen": "Hydrogène",
        "I-6 twin turbo premium unleaded": "I-6 double turbo super sans plomb",
        "Manual Steering": "Direction non assistée",
        "There are no reviews and news": "Aucun avis / nouvelle",
        "Port/direct injection": "Injection indirecte/directe",
        "Power Steering": "Direction assistée",
        "V-6 twin turbo regular unleaded": "V-6 double turbo régulier sans plomb",
        "V-8 regular unleaded": "V-8 régulier sans plomb",
        "Wheel drive": "Entraînement",
        "Compare {0}": "Comparer {0}",
        "DRIVABILITY": "AGRÉMENT CONDUITE",
        "FEATURES": "CARACTÉRISTIQUES",
        "POWERTRAIN": "GROUPE MOTOPROPULSEUR",
        "PRACTICALITY": "COMMODITÉ",
        "QUALITY": "SÉCURITÉ",
        "STYLING": "STYLISME",
        "USABILITY/ERGONOMICS": "UTILISATION/ERGONOMIE",
        "VALUE": "VALEUR",
        "Owner Score": "Avis des proprios",
        "Deals": "offres",
        "in": "à",
        "Review & Compare: <br /> {0} Trims": "Examiner et comparer : <br /> {0} finitions",
        "Review: {0} Trim": "Examiner : {0} finition",
        "The {0} has <strong>{1} trims.</strong> Below you will be able to review all the trims with the option to compare.": "La {0} comporte <strong>{1} finitions.</strong> Ci-dessous, vous pourrez passer en revue toutes les versions avec la possibilité de les comparer.",
        "The {0} has <strong>1 trim.</strong> Below you will be able to review this trim in detail.": "Le {0} a <strong>1 garniture.</strong> Vous pourrez examiner cette garniture en détail ci-dessous.",
        "trims available": "finitions disponibles",
        "trim available": "finition disponibles",
        "Filter by trim level": "Filtrer par niveau de garniture intérieure",
        "Apply": "Appliquer",
        "Clear all": "Effacer",
        "of": "de",
        "Add to comparison": "Ajouter à la comparaison",
        "Show full trim specifications": "Afficher toutes les caractéristiques des finitions",
        "Starting at": "À partir de"
    }

    /* Trims */

    document.addEventListener('DOMContentLoaded', () => {

        const dataTrimsElements = document.querySelectorAll('[data-trims]');

        if (dataTrimsElements.length > 0) {

            const make = manufacturer;
            const model = modelOverride;
            const yearMeta = document.querySelector('meta[name="year"]');
            const year = yearMeta && yearMeta.content ? yearMeta.content : "2023";

            let url = '';

            if (params.get('qa') === 'true' && lang === 'fr') {
                url = `https://apimqa.autohebdo.net/research/v1/trims-information?make=${make}&model=${model}&year=${year}`;
            } else if (params.get('qa') === 'true') {
                url = `https://apimqa.autotrader.ca/research/v1/trims-information?make=${make}&model=${model}&year=${year}`;
            } else if (lang === 'fr') {
                url = `https://apimktprd01.autohebdo.net/research/v1/trims-information?make=${make}&model=${model}&year=${year}`;
            } else {
                url = `https://apimktprd01.autotrader.ca/research/v1/trims-information?make=${make}&model=${model}&year=${year}`;
            }

            fetch(url, { credentials: 'include' })
                .then(response => response.json())
                .then(data => {

                    dataTrimsElements.forEach(dataTrims => {

                        const clone = dataTrims.firstElementChild.cloneNode(true);

                        dataTrims.innerHTML = '';

                        data.forEach((item, index) => {
                            const itemClone = clone.cloneNode(true);

                            dataTrims.appendChild(itemClone);
                            // Update the slides
                            swiperTrims.updateSlides();

                            itemClone.setAttribute('data-gtm-content-name', 'Slide ' + (index + 1) + ' - ' + item['name']);

                            let gtmModel = itemClone.querySelector('[data-gtm-content-model]');
                            if (gtmModel) {
                                gtmModel.setAttribute('data-gtm-content-model', item['name']);
                            }

                            itemClone.querySelectorAll('[data-trim-text]').forEach(el => {
                                const keys = el.getAttribute('data-trim-text').split('-');
                                let value = item;
                                keys.forEach(key => {
                                    value = value[key];
                                });

                                el.innerHTML = value;
                            });

                            itemClone.querySelectorAll('[data-trim-image]').forEach(el => {
                                const keys = el.getAttribute('data-trim-image').split('-');
                                let value = item;
                                keys.forEach(key => {
                                    value = value[key];
                                });

                                if (value) {
                                    el.src = value;
                                }
                            });

                            let trimCount = itemClone.querySelectorAll('[data-trim-count]');
                            if (trimCount.length > 0) {
                                trimCount.forEach(el => {
                                    const countType = el.getAttribute('data-trim-count');
                                    if (countType === 'current') {
                                        el.innerHTML = index + 1;
                                    } else if (countType === 'total') {
                                        el.innerHTML = data.length;
                                    }
                                });
                            }

                            const keySpecsEl = itemClone.querySelector('[data-trim-key-specifications]');
                            if (keySpecsEl) {
                                const keySpecClone = keySpecsEl.firstElementChild.cloneNode(true);

                                keySpecsEl.innerHTML = '';

                                item.keySpecifications.forEach(spec => {
                                    const newKeySpecClone = keySpecClone.cloneNode(true);
                                    newKeySpecClone.innerHTML = spec;
                                    keySpecsEl.appendChild(newKeySpecClone);
                                });
                            }

                            const specsEl = itemClone.querySelector('[data-trims-specs]');
                            if (specsEl) {
                                const specClone = specsEl.children[1].cloneNode(true);
                                specsEl.removeChild(specsEl.children[1]);
                                Object.entries(item.categories).forEach(([key, value]) => {
                                    const newSpecClone = specClone.cloneNode(true);


                                    if (lang === 'fr') {

                                        newSpecClone.querySelector('[data-trims-specs=title]').innerHTML = mapping[key];

                                    } else {

                                        newSpecClone.querySelector('[data-trims-specs=title]').innerHTML = key;
                                    }

                                    newSpecClone.querySelector('[mirror-click]').setAttribute('mirror-click', key);

                                    const listEl = newSpecClone.querySelector('[data-trims-spec=list]');
                                    const listItemClone = listEl.firstElementChild.cloneNode(true);

                                    listEl.innerHTML = '';
                                    Object.entries(value).forEach(([specKey, specValue]) => {
                                        const newListItemClone = listItemClone.cloneNode(true);

                                        if (lang === 'fr') {

                                            newListItemClone.querySelector('[data-trims-spec=key]').innerHTML = mapping[specKey];

                                        } else {

                                            newListItemClone.querySelector('[data-trims-spec=key]').innerHTML = specKey;
                                        }

                                        if (specValue.toLowerCase() === 'yes') {
                                            newListItemClone.querySelector('[data-trims-spec=value]').innerHTML = lang === 'fr' ? 'Inclus' : 'Included';                                            
                                            newListItemClone.querySelector('[data-trims-spec=value]').className += ' trim_table_included';
                                        } else if (specValue.toLowerCase() === 'no') {
                                            newListItemClone.querySelector('[data-trims-spec=value]').innerHTML = lang === 'fr' ? 'Inclus' : 'Non Inclus';                                            
                                            newListItemClone.querySelector('[data-trims-spec=value]').className += ' trim_table_not-available';
                                        } else {
                                            newListItemClone.querySelector('[data-trims-spec=value]').innerHTML = specValue;
                                        }

                                        listEl.appendChild(newListItemClone);
                                    });

                                    specsEl.appendChild(newSpecClone);
                                });
                            }

                        });

                        const totalEls = document.querySelectorAll('[data-trim-total]');

                        totalEls.forEach(totalEl => {
                            if (totalEl) {

                                if (lang === 'fr') {

                                    totalEl.innerHTML = `${data.length} ${data.length === 1 ? 'version' : 'versions'}`;

                                } else {

                                    totalEl.innerHTML = `${data.length} ${data.length === 1 ? 'trim' : 'trims'}`;

                                }

                            }
                        });
                        window.Webflow && window.Webflow.destroy();
                        window.Webflow && window.Webflow.ready();
                        window.Webflow && window.Webflow.require('ix2').init();
                        document.dispatchEvent(new Event('readystatechange'));

                        // Mirror Clicks

                        const mirrorElements = document.querySelectorAll('[mirror-click]');

                        mirrorElements.forEach(element => {
                            element.addEventListener('click', function (event) {
                                // Only proceed if this is a user-initiated event
                                if (!event.isTrusted) {
                                    return;
                                }

                                const mirrorValue = this.getAttribute('mirror-click');

                                const sameMirrorElements = document.querySelectorAll(`[mirror-click="${mirrorValue}"]`);

                                sameMirrorElements.forEach(el => {
                                    if (el !== this) { // Avoid infinite loop by not clicking the element that was originally clicked
                                        el.click();
                                    }
                                });
                            });
                        });

                    });
                });

        }
    });

})();
