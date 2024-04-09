    const make = document.querySelector('meta[name="make"]').content;
    const model = document.querySelector('meta[name="model"]').content;
    const yearMeta = document.querySelector('meta[name="year"]');
    const year = yearMeta && yearMeta.content ? yearMeta.content : "2023";

    const url = `https://apimci.autohebdo.net/research/v1/trims-information?make=${make}&model=${model}&year=${year}`;

    console.log(url);

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const dataTrims = document.querySelector('[data-trims]');
            const clone = dataTrims.firstElementChild.cloneNode(true);

            dataTrims.innerHTML = '';

            data.forEach((item, index) => {
                const itemClone = clone.cloneNode(true);

                dataTrims.appendChild(itemClone);

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

                const specsEl = itemClone.querySelector('[data-trims-specs]');
                if (specsEl) {
                    const specClone = specsEl.children[1].cloneNode(true);
                    specsEl.removeChild(specsEl.children[1]);
                    Object.entries(item.categories).forEach(([key, value]) => {
                        const newSpecClone = specClone.cloneNode(true);
                        newSpecClone.querySelector('[data-trims-specs=title]').innerHTML = key;

                        // Set the value of the mirror-click attribute to the key
                        newSpecClone.querySelector('[mirror-click]').setAttribute('mirror-click', key);

                        const listEl = newSpecClone.querySelector('[data-trims-spec=list]');
                            const listItemClone = listEl.firstElementChild.cloneNode(true);

                            // Clear the listEl after cloning
                            listEl.innerHTML = '';

                        Object.entries(value).forEach(([specKey, specValue]) => {

                            const newListItemClone = listItemClone.cloneNode(true);
                            newListItemClone.querySelector('[data-trims-spec=key]').innerHTML = specKey;
                            newListItemClone.querySelector('[data-trims-spec=value]').innerHTML = specValue;

                            listEl.appendChild(newListItemClone);
                        });
                        
                        specsEl.appendChild(newSpecClone);
                    });
                }

            });

            // New code for data-trim-total
            const totalEl = document.querySelector('[data-trim-total]');
            if (totalEl) {
                totalEl.innerHTML = `${data.length} ${data.length === 1 ? 'trim' : 'trims'}`;
            }
            window.Webflow && window.Webflow.destroy();
            window.Webflow && window.Webflow.ready();
            window.Webflow && window.Webflow.require('ix2').init();
            document.dispatchEvent(new Event('readystatechange'));


            //Mirror Clicks

            // Select all elements with the 'mirror' attribute
            const mirrorElements = document.querySelectorAll('[mirror-click]');

            // Add a click event listener to each of these elements
            mirrorElements.forEach(element => {
                element.addEventListener('click', function (event) {
                    // Only proceed if this is a user-initiated event
                    if (!event.isTrusted) {
                        return;
                    }

                    // Get the value of the 'mirror' attribute of the clicked element
                    const mirrorValue = this.getAttribute('mirror-click');

                    // Select all elements with the same 'mirror' attribute value
                    const sameMirrorElements = document.querySelectorAll(`[mirror-click="${mirrorValue}"]`);

                    // Simulate a click event on these elements
                    sameMirrorElements.forEach(el => {
                        if (el !== this) { // Avoid infinite loop by not clicking the element that was originally clicked
                            el.click();
                        }
                    });
                });
            });

        });
