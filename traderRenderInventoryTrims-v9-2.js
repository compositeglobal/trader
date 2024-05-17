/* Inventory */

document.addEventListener('DOMContentLoaded', () => {

    let cards = document.querySelectorAll('[data-at-card]');

    if (cards.length > 0) {

        const manufacturerMeta = document.querySelector('meta[name="manufacturer"]');
        const modelMeta = document.querySelector('meta[name="model"]');
        const modelMinYear = document.querySelector('meta[name="modelYear"]');
        let url = 'https://apimqa.autotrader.ca/research/v1/vehicle-inventory?make=';

        if (manufacturerMeta) {
            url += manufacturerMeta.getAttribute('content');
            if (modelMeta) {
                url += '&model=' + modelMeta.getAttribute('content');
            }
            if (modelMeta) {
                url += '&minYear=' + modelMinYear.getAttribute('content');
            }
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
                                value = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'CAD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
                            }
                            if (key === 'distance') {
                                value = `${value} km from you`;
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

/* Trims */

document.addEventListener('DOMContentLoaded', () => {

    const dataTrimsElements = document.querySelectorAll('[data-trims]');

    if (dataTrimsElements.length > 0) {

        const make = document.querySelector('meta[name="make"]').content;
        const model = document.querySelector('meta[name="model"]').content;
        const yearMeta = document.querySelector('meta[name="year"]');
        const year = yearMeta && yearMeta.content ? yearMeta.content : "2023";

        const url = `https://apimqa.autotrader.ca/research/v1/trims-information?make=${make}&model=${model}&year=${year}`;

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
                                newSpecClone.querySelector('[data-trims-specs=title]').innerHTML = key;

                                newSpecClone.querySelector('[mirror-click]').setAttribute('mirror-click', key);

                                const listEl = newSpecClone.querySelector('[data-trims-spec=list]');
                                const listItemClone = listEl.firstElementChild.cloneNode(true);

                                listEl.innerHTML = '';
                                Object.entries(value).forEach(([specKey, specValue]) => {
                                    const newListItemClone = listItemClone.cloneNode(true);

                                    if (specKey === 'DriverAssistance') {
                                        newListItemClone.querySelector('[data-trims-spec=key]').innerHTML = 'Driver Assistance';
                                    } else {
                                        newListItemClone.querySelector('[data-trims-spec=key]').innerHTML = specKey;
                                    }

                                    if (specValue.toLowerCase() === 'yes') {
                                        newListItemClone.querySelector('[data-trims-spec=value]').innerHTML = 'Included';
                                        newListItemClone.querySelector('[data-trims-spec=value]').className += ' trim_table_included';
                                    } else if (specValue.toLowerCase() === 'no') {
                                        newListItemClone.querySelector('[data-trims-spec=value]').innerHTML = 'Not Available';
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
                            totalEl.innerHTML = `${data.length} ${data.length === 1 ? 'trim' : 'trims'}`;
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
