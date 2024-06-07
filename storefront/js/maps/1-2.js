(function () {
    /* Configuration and QA */

    let params = new URLSearchParams(window.location.search);

    let lang;
    if (window.location.hostname.includes('beta') && params.get('qa') === 'true' && params.get('lang')) {
        lang = params.get('lang');
    } else {
        lang = document.documentElement.lang;
    }

    let manufacturer;
    if (window.location.hostname.includes('beta') && params.get('qa') === 'true' && params.get('manufacturer')) {
        manufacturer = params.get('manufacturer');
    } else {
        const metaTag = document.querySelector('meta[name="manufacturer"]');
        manufacturer = metaTag ? metaTag.getAttribute('content') : '';
    }

    let modelOverride;
    if (window.location.hostname.includes('beta') && params.get('qa') === 'true' && params.get('model')) {
        modelOverride = params.get('model');
    } else {
        const metaTag = document.querySelector('meta[name="model"]');
        modelOverride = metaTag ? metaTag.getAttribute('content') : '';
    }

    if (window.location.hostname.includes('beta') && params.get('qa') === 'true') {
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
                .then(response => {
                    if (!response.ok || response.status === 204) {
                        let inventoryCard = document.querySelector('[data-at-card]');
                        if (inventoryCard) {
                            inventoryCard.closest('section').remove();
                        }
                        throw new Error('Failed Inventory fetch due to error. Status code: ${response.status}`);');
                    }
                    return response.json();
                }).then(data => {
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

                }).catch(error => {
                    console.error('Fetch error:', error);
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
        "Front Head Air bag": "Coussin gonflable avant",
        "Front Head Room": "Dégagement tête, avant",
        "Front Leg Room": "Dégagement genoux, avant",
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
        "4 Wheel Disc": "Disque aux 4 roues",
        "4 Wheel Drum": "Tambour aux 4 roues",
        "All-wheel": "4RM",
        "Flex Fuel": "Flex Fuel",
        "for": "pour",
        "Front-wheel": "Roues avant",
        "Front Disc Rear Drum": "Disques avant/tambours arr.",
        "Gasoline": "Essence",
        "Gasoline direct injection": "Injection directe d'essence",
        "Hydrogen": "Hydrogène",
        "I-6 twin turbo premium unleaded": "I-6 double turbo super sans plomb",
        "Manual Steering": "Direction non assistée",
        "There are no reviews and news": "Aucun avis / nouvelle",
        "Port/direct injection": "Injection indirecte/directe",
        "Power Steering": "Direction assistée",
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
                .then(response => {
                    if (!response.ok || response.status === 204) {
                        let inventoryCard = document.querySelector('[data-trims]');
                        if (inventoryCard) {
                            inventoryCard.closest('section').remove();
                        }
                        throw new Error('Failed trims fetch due to error. Status code: ${response.status}`);');
                    }
                    return response.json();
                }).then(data => {

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
                                            newListItemClone.querySelector('[data-trims-spec=value]').innerHTML = lang === 'fr' ? 'Non Inclus' : 'Not Included';
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

                        document.body.removeAttribute('data-skeleton-trims');

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

// Find and populate a dealership search instance. 
if (document.querySelector('[data-map]')) {

    // Configure variables for APIs 

    const mapKey = 'AIzaSyBbYP8SR4xUPr8NHLx6rlBaaz-k_72G7N0';
    
    let params = new URLSearchParams(window.location.search);

    let lang;
    if (window.location.hostname.includes('beta') && params.get('qa') === 'true' && params.get('lang')) {
        lang = params.get('lang');
    } else {
        lang = document.documentElement.lang;
    }

    let manufacturer;
    if (window.location.hostname.includes('beta') && (params.get('qa') === 'true' && params.get('manufacturer'))) {
        manufacturer = params.get('manufacturer');
    } else {
        const metaTag = document.querySelector('meta[name="manufacturer"]');
        manufacturer = metaTag ? metaTag.getAttribute('content') : '';
    }

    if (window.location.hostname.includes('beta') && params.get('qa') === 'true') {
        console.log('QA mode is activated - API requests are soruced from the "' + lang + '" language. The manufacturer has been set to "' + manufacturer + '".');
    }

    const postcodeElement = document.querySelector('[data-map="postcode"]');


    // Construct the dealership fetch URL

    let url = '';

    if (params.get('qa') === 'true' && lang === 'fr') {

        url = `https://apimqa.autohebdo.net/research/v1/dealer-search?oemName=` + manufacturer;

    } else if (params.get('qa') === 'true' && lang === 'en') {

        url = `https://apimqa.autotrader.ca/research/v1/dealer-search?oemName=` + manufacturer;

    } else if (lang === 'fr') {

        url = `https://apimktprd01.autohebdo.net/research/v1/dealer-search?oemName=` + manufacturer;

    } else {

        url = `https://apimktprd01.autotrader.ca/research/v1/dealer-search?oemName=` + manufacturer;
    }

    // Define an async function to fetch the data
    async function fetchData() {
        const response = await fetch(url, { credentials: 'include' });
        return response.json(); // This returns a promise
    }

    // Call the function and store the promise
    
    let dataPromise = fetchData();

    let fetchLongitude;
    let fetchLatitude;
    
    dataPromise.then(data => {
        if (data && data.userLocation) {
            fetchLongitude = data.userLocation.longitude;
            fetchLatitude = data.userLocation.latitude;
        }
    });

    // Function to calculate the distance between two points on the Earth

    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
            ;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in km
        return distance;
    }

    function deg2rad(deg) {
        return deg * (Math.PI / 180)
    }

    // Initialize lastRequestedDirections variable
    let lastRequestedDirections = null;
    // Main map code responsible for creating the map, adding markers, and populating the list

    function initMap() {

        let destinationLocation = '';

        // Get the URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const latParam = parseFloat(urlParams.get('lat'));
        const longParam = parseFloat(urlParams.get('long'));

// If the lat and long parameters are present, use them as the user's location
let userLocationPromise;
if (!isNaN(latParam) && !isNaN(longParam)) {
    userLocationPromise = Promise.resolve({
        lat: latParam,
        lng: longParam,
    });
} else {
    userLocationPromise = dataPromise.then(data => {
        if (data && data.userLocation) {
            fetchLongitude = data.userLocation.longitude;
            fetchLatitude = data.userLocation.latitude;
        }
        return {
            lat: fetchLatitude || 43.70, // Use fetched latitude or default to Toronto
            lng: fetchLongitude || -79.42 // Use fetched longitude or default to Toronto
        };
    });
}

        userLocationPromise.then(userLocation => {

            function calculateAndDisplayRoute(directionsService, directionsRenderer, origin, destination, travelMode) {
                directionsService.route(
                    {
                        origin: origin,
                        destination: destination,
                        travelMode: travelMode
                    },
                    (response, status) => {
                        // console.log(destination);

                        if (status === 'OK') {
                            directionsRenderer.setDirections(response);

                            // Get the destination address of the last leg
                            let legs = response.routes[0].legs;
                            let lastLeg = legs[legs.length - 1];
                            let destinationAddress = lastLeg.end_address;

                            document.querySelector('[data-map=destination]').innerHTML = destinationAddress;
                        } else {
                            window.alert('Directions request failed due to ' + status);
                        }
                    }

                );
            }

            // Get the update location element
            const updateLocationElement = document.querySelector('[data-map="update-location"]');

            if (updateLocationElement) {
                updateLocationElement.addEventListener('click', () => {
                    // Get the postcode from the element with data-map="postcode"
                    // const postcodeElement = document.querySelector('[data-map="postcode"]');
                    if (postcodeElement) {
                        const postcode = postcodeElement.value;

                        // Use Google Maps Geocoding API to get the latitude and longitude from the postcode
                        fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${postcode}&key=${mapKey}&language=${lang}`)
                            .then(response => response.json())
                            .then(data => {
                                const location = data.results[0].geometry.location;

                                // Update userLocation variable
                                userLocation.lat = location.lat;
                                userLocation.lng = location.lng;

                            });
                    }

                    lastRequestedDirections.click();

                });
            }

// Use a geocoding service to get the postcode from the latitude and longitude

fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${userLocation.lat},${userLocation.lng}&key=${mapKey}&language=${lang}`)
    .then(response => response.json())
    .then(data => {

console.log(data)

        // Set the postcode in the element with the attribute data-map="postcode"
        const postcodeElement = document.querySelector('[data-map="postcode"]');
        console.log(postcodeElement);

        console.log(data.results)
        console.log(data.results[0])

        if (postcodeElement && data.results && data.results[0]) {
            const addressComponent = data.results[0].address_components.find(component => component.types.includes('postal_code'));
            if (addressComponent) {
                const postcode = addressComponent.short_name;
                postcodeElement.value = postcode;

                // Add an event listener to update the user's location when the postcode is changed
                postcodeElement.addEventListener('change', event => {
                    // Use a geocoding service to get the latitude and longitude from the postcode
                    fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${event.target.value}&key=${mapKey}&language=${lang}`)
                        .then(response => response.json())
                        .then(data => {
                            userLocation.lat = data.results[0].geometry.location.lat;
                            userLocation.lng = data.results[0].geometry.location.lng;
                        });
                });
            } else {
                console.log('No postal_code found in address_components');
            }
        } else {
            console.log('No element with data-map="postcode" found');
        }
    });
            dataPromise.then(data => {
                // Replace locations with companies
                const locations = data.companies;

                // Calculate the distance between the user's location and each location
                locations.forEach(location => {
                    const latDiff = parseFloat(location.latitude) - userLocation.lat;
                    const lngDiff = parseFloat(location.longitude) - userLocation.lng;
                    location.distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);
                });

                // Sort the locations by distance
                locations.sort((a, b) => a.distance - b.distance);

                // console.log(userLocation)

                // Create a new map centered at the user's location
                const map = new google.maps.Map(document.getElementById('map'), {
                    zoom: 11,
                    center: userLocation,
                    styles: [
                        {
                            featureType: 'poi',
                            stylers: [{ visibility: 'off' }]
                        }
                    ],
                    streetViewControl: false, // This will hide the Street View control
                    mapTypeControl: false // This will hide the Map/Satellite control
                });

                // Maps Directons 

                // Create a new DirectionsService object
                const directionsService = new google.maps.DirectionsService();
                // Create a new DirectionsRenderer object
                const directionsRenderer = new google.maps.DirectionsRenderer();

                // Set the map for the DirectionsRenderer
                directionsRenderer.setMap(map);

                // Set the panel for the DirectionsRenderer
                let panelElement = document.querySelector('[data-maps-directions]');
                directionsRenderer.setPanel(panelElement);

                // Get the list and the template list item
                const list = document.querySelector('[data-map-list]');
                const template = list.firstElementChild;

                // Add a marker and a list item for each location
                locations.forEach((location, index) => {
                    location.distance = calculateDistance(userLocation.lat, userLocation.lng, location.latitude, location.longitude);
                    const marker = new google.maps.Marker({
                        position: { lat: parseFloat(location.latitude), lng: parseFloat(location.longitude) },
                        map: map,
                        icon: 'https://uploads-ssl.webflow.com/64c57def3601adf69171da07/65e894381acc2469159cdc1c_dormant.svg'
                    });

                    destinationLocation = location.latitude + ',' + location.longitude;

                    // Create an InfoWindow for the marker

                    let phoneNumber = location.phoneNumber;
                    if (phoneNumber) {
                        phoneNumber = phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
                    }

                    // Construct langauges varaibles. 

                    let distanceCopy = 'km de chez vous';
                    let directionsCopy = 'Obtenir des directions';

                    if (lang === 'fr') {

                        distanceCopy = 'km de chez vous';
                        directionsCopy = 'Obtenir des directions';


                    } else {

                        distanceCopy = 'km from you';
                        directionsCopy = 'Get Directions';

                    }
                    const infoWindow = new google.maps.InfoWindow({
                        content: `
                            <div class="maps_infowindow maps_tip_heading">
                            <div class="maps_infowindow_header">
    
                            <img src="${location.logoUrl}" loading="lazy" alt="" class="maps_infoWindow_image">
                            
                            <div class="maps_infowindow_heading">${location.name}</div></div>
                            
                            <div class="maps_infowindow_divider">
                            
                            </div>
                            
                            <ul role="list" class="map_item_list_window">
                            
                            <li class="map_item_list_item">
                            
                            <div class="map_item_list_item_icon w-embed"> <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.99935 7.26213C6.61257 7.26213 6.24164 7.10848 5.96815 6.83499C5.69466 6.5615 5.54102 6.19057 5.54102 5.80379C5.54102 5.41702 5.69466 5.04609 5.96815 4.77259C6.24164 4.4991 6.61257 4.34546 6.99935 4.34546C7.38612 4.34546 7.75706 4.4991 8.03055 4.77259C8.30404 5.04609 8.45768 5.41702 8.45768 5.80379C8.45768 5.9953 8.41996 6.18494 8.34667 6.36187C8.27339 6.53881 8.16597 6.69957 8.03055 6.83499C7.89513 6.97041 7.73436 7.07783 7.55743 7.15112C7.3805 7.2244 7.19086 7.26213 6.99935 7.26213ZM6.99935 1.72046C5.91638 1.72046 4.87777 2.15067 4.112 2.91644C3.34622 3.68221 2.91602 4.72082 2.91602 5.80379C2.91602 8.86629 6.99935 13.3871 6.99935 13.3871C6.99935 13.3871 11.0827 8.86629 11.0827 5.80379C11.0827 4.72082 10.6525 3.68221 9.8867 2.91644C9.12093 2.15067 8.08232 1.72046 6.99935 1.72046Z" fill="#3E3E3E"></path>
                            </svg></div>
                            
                            <div>${location.address} - ${location.distance.toFixed(2)} ${distanceCopy}</div>
                            
                            </li>
                            
                            <li class="map_item_list_item">
                            
                            <div class="map_item_list_item_icon w-embed"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3.86167 6.29417C4.70167 7.945 6.055 9.29833 7.70583 10.1383L8.98917 8.855C9.1525 8.69167 9.38 8.645 9.58417 8.70917C10.2375 8.925 10.9375 9.04167 11.6667 9.04167C11.8214 9.04167 11.9697 9.10312 12.0791 9.21252C12.1885 9.32192 12.25 9.47029 12.25 9.625V11.6667C12.25 11.8214 12.1885 11.9697 12.0791 12.0791C11.9697 12.1885 11.8214 12.25 11.6667 12.25C9.0366 12.25 6.51426 11.2052 4.65452 9.34548C2.79479 7.48574 1.75 4.9634 1.75 2.33333C1.75 2.17862 1.81146 2.03025 1.92085 1.92085C2.03025 1.81146 2.17862 1.75 2.33333 1.75H4.375C4.52971 1.75 4.67808 1.81146 4.78748 1.92085C4.89687 2.03025 4.95833 2.17862 4.95833 2.33333C4.95833 3.0625 5.075 3.7625 5.29083 4.41583C5.355 4.62 5.30833 4.8475 5.145 5.01083L3.86167 6.29417Z" fill="#3E3E3E"></path>
                            </svg></div>
                            
                            <div><a target="_blank" href="tel:${location.phoneNumber}">${phoneNumber}</a></div>
                            
                            </li>
    
                            <li>
                            <a href="#" data-map-directions="${location.latitude}, ${location.longitude}">${directionsCopy}</a>
                            </li>
                            
                            </ul>
                            
                            </div>
    
    
                                         `
                    });

                    let timeoutId = null;

                    // Add a click event listener to the marker
                    marker.addListener('click', () => {
                        // Open the InfoWindow when the marker is clicked
                        infoWindow.close();
                        infoWindow.open(map, marker);
                        marker.setIcon('https://uploads-ssl.webflow.com/64c57def3601adf69171da07/65e894396b30c86b21522c13_active.svg');
                        li.classList.add('hover');
                    });

                    // Add a click event listener to the map
                    google.maps.event.addListener(map, 'click', () => {
                        // Close the InfoWindow when the map is clicked
                        infoWindow.close();
                        infoWindow.close();
                        marker.setIcon('https://uploads-ssl.webflow.com/64c57def3601adf69171da07/65e894381acc2469159cdc1c_dormant.svg');
                        li.classList.remove('hover');
                    });

                    // Show the InfoWindow and change the icon when the marker is hovered
                    marker.addListener('mouseover', () => {
                        infoWindow.close();
                        clearTimeout(timeoutId); // Clear the timeout if it's set
                        infoWindow.open(map, marker);
                        marker.setIcon('https://uploads-ssl.webflow.com/64c57def3601adf69171da07/65e894396b30c86b21522c13_active.svg'); // Set the icon to a hover image
                        li.classList.add('hover');
                    });

                    // Hide the InfoWindow and change the icon back when the mouse leaves the marker
                    marker.addListener('mouseout', () => {
                        // Set a timeout to close the InfoWindow after 1 second
                        timeoutId = setTimeout(() => {
                            infoWindow.close();
                            marker.setIcon('https://uploads-ssl.webflow.com/64c57def3601adf69171da07/65e894381acc2469159cdc1c_dormant.svg'); // Set the icon back to the default image
                            li.classList.remove('hover');
                        }, 1000); // 1000 milliseconds = 1 second
                    });

                    // Clone the template and populate it with data

                    const li = template.cloneNode(true);

                    li.querySelectorAll('[data-map], [data-map-image], [data-map-distance]').forEach(element => {
                        const key = element.hasAttribute('data-map') ? element.getAttribute('data-map') :
                            element.hasAttribute('data-map-image') ? element.getAttribute('data-map-image') :
                                'distance';

                        if (location.hasOwnProperty(key)) {
                            li.setAttribute('data-gtm-content-model', location['name']);

                            var directionButton = li.querySelector('[data-map="direction-button"]');
                            if (directionButton) {
                                directionButton.setAttribute('data-gtm-content-model', location['name']);
                            }

                            li.setAttribute('data-gtm-content-model', location['name']);

                            if (element.hasAttribute('data-map') && element.getAttribute('data-map') === 'phoneNumber') {

                                let phoneNumber = location[key];
                                if (phoneNumber) {

                                    phoneNumber = phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');

                                    element.innerHTML = phoneNumber;
                                    element.href = `tel:${location[key]}`;
                                }

                            } else if (element.hasAttribute('data-map')) {
                                element.innerHTML = location[key];
                            } else if (element.hasAttribute('data-map-image')) {
                                if (location[key] && location[key].trim() !== '') {
                                    element.src = location[key];
                                    element.srcset = location[key];
                                }
                            } else if (element.hasAttribute('data-map-distance')) {
                                element.textContent = `${location[key].toFixed(2)} km`;
                            }
                        }

                        // If the element is a direction button, add an event listener
                        if (key === 'direction-button') {
                            element.addEventListener('click', function () {
                                destinationLocation = {
                                    lat: location.latitude,
                                    lng: location.longitude
                                };
                                calculateAndDisplayRoute(directionsService, directionsRenderer, userLocation, destinationLocation, google.maps.TravelMode.DRIVING);

                                lastRequestedDirections = element;

                                //  console.log(lastRequestedDirections);

                                // Simulate a click on the element with the data-maps-directions-open attribute
                                let openElement = document.querySelector('[data-maps-directions-open]');
                                if (openElement) {
                                    openElement.click();
                                }
                            });
                        }
                    });
                    li.addEventListener('click', () => {
                        map.setCenter(marker.getPosition());
                        map.setZoom(15);
                    });

                    // Clear the list before appending the first location
                    if (index === 0) {
                        while (list.firstChild) {
                            list.removeChild(list.firstChild);
                        }
                    }

                    // Append the new list item to the list
                    list.appendChild(li);
                });

                // Event listerners for UI elements

                document.addEventListener('click', function (event) {
                    if (event.target.dataset.mapDirections) {
                        destinationLocation = {
                            lat: parseFloat(event.target.dataset.mapDirections.split(',')[0]),
                            lng: parseFloat(event.target.dataset.mapDirections.split(',')[1])
                        };
                        calculateAndDisplayRoute(directionsService, directionsRenderer, userLocation, destinationLocation, google.maps.TravelMode.DRIVING);

                        // Simulate a click on the element with the data-maps-directions-open attribute
                        let openElement = document.querySelector('[data-maps-directions-open]');

                        if (openElement) {
                            openElement.click();
                        }
                    }
                });

                document.querySelector('[data-maps-directions-mode]').addEventListener('click', function (event) {

                    if (event.target.tagName === 'BUTTON') {
                        let selectedMode = event.target.id;

                        // console.log(destinationLocation)

                        if (destinationLocation) {
                            calculateAndDisplayRoute(directionsService, directionsRenderer, userLocation, destinationLocation, google.maps.TravelMode[selectedMode]);
                        }
                    }
                });

                document.querySelector('[data-maps="close-directions"]').addEventListener('click', function (event) {

                    directionsRenderer.setDirections(null);

                });

                document.body.removeAttribute('data-skeleton-maps');

            })

        }).catch(error => console.error('Error:', error));

    }

    // Create a new script element
    let script = document.createElement('script');

    // Set the source of the script to the Google Maps API
    script.src = `https://maps.googleapis.com/maps/api/js?key=${mapKey}&language=${lang}&callback=initMap`;

    // Append the script element to the body of the document
    document.body.appendChild(script);

}
