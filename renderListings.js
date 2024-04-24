document.addEventListener('DOMContentLoaded', () => {

    let cards = document.querySelectorAll('[data-at-card]');

    if (cards.length > 0) {

        const manufacturerMeta = document.querySelector('meta[name="manufacturer"]');
        const modelMeta = document.querySelector('meta[name="model"]');
        let url = 'https://apimqa.autotrader.ca/research/v1/vehicle-inventory?make=';

        if (manufacturerMeta) {
            url += manufacturerMeta.getAttribute('content');
            if (modelMeta) {
                url += '&model=' + modelMeta.getAttribute('content');
            }
        }

        fetch(url)
            .then(response => response.json())
            .then(data => {
                document.body.removeAttribute('data-skeleton');

                // If there are more cards than vehicles, remove the extra cards
                if (cards.length > data.vehicles.length) {
                    for (let i = data.vehicles.length; i < cards.length; i++) {
                        cards[i].remove();
                    }
                }

                // Update the cards NodeList to reflect the removed cards
                cards = document.querySelectorAll('[data-at-card]');

                cards.forEach((card, index) => {
                    const vehicle = data.vehicles[index];
                    if (vehicle) {

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

            });
    }

});

document.addEventListener('DOMContentLoaded', () => {

    const dataTrims = document.querySelector('[data-trims]');

    if (dataTrims) {

        const make = document.querySelector('meta[name="make"]').content;
        const model = document.querySelector('meta[name="model"]').content;
        const yearMeta = document.querySelector('meta[name="year"]');
        const year = yearMeta && yearMeta.content ? yearMeta.content : "2023";

        const url = `https://apimqa.autotrader.ca/research/v1/trims-information?make=${make}&model=${model}&year=${year}`;

        fetch(url)
            .then(response => response.json())
            .then(data => {
                const dataTrims = document.querySelector('[data-trims]');
                const clone = dataTrims.firstElementChild.cloneNode(true);

                dataTrims.innerHTML = '';

                data.forEach((item, index) => {
                    const itemClone = clone.cloneNode(true);

                    dataTrims.appendChild(itemClone);

                    itemClone.setAttribute('data-gtm-content-name', (index + 1) + ' - ' + item['name']);

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

                        el.src = value;
                    });

                    itemClone.querySelectorAll('[data-trim-count]').forEach(el => {
                        const countType = el.getAttribute('data-trim-count');
                        if (countType === 'current') {
                            el.innerHTML = index + 1;
                        } else if (countType === 'total') {
                            el.innerHTML = data.length;
                        }
                    });

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

                const totalEl = document.querySelector('[data-trim-total]');
                if (totalEl) {
                    totalEl.innerHTML = `${data.length} ${data.length === 1 ? 'trim' : 'trims'}`;
                }
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
    }
});
