((d, w) => {
  const LOCALS_NAME = "gl";
  const LOCAL_URL = "https://cdn.jsdelivr.net/gh/altaf234/form-integrity";
  const redirect = (u) => {
    const a = d.createElement("a");
    a.href = u;
    a.click();
  };
  const tagify = function (name, oneSided, attributes) {
    let attr = "";
    attributes &&
      Object.keys(attributes).forEach((key) => {
        attr += " " + key + "=" + '"' + attributes[key] + '"';
      });
    return oneSided
      ? "<" + name + attr + "/>"
      : "<" + name + attr + "></" + name + ">";
  };
  const readFile = async (path, local) => {
    const url = local
      ? LOCAL_URL + path
      : "https://get-lead.squadora.com" + path;
    const res = await fetch(url, { mode: "cors" });
    return await res.text();
  };
  const readDir = async (path) => {
    const res = await fetch("https://get-lead.squadora.com" + path, {
      mode: "cors",
    });
    return (await res.json()).files;
  };
  const defineElements = async () => {
    const files = await readDir("/jsx");
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const elm = class extends HTMLElement {
        constructor() {
          super();
          this.#setup();
        }
        async #setup() {
          const src = await readFile("/jsx/" + file);
          this.elements = JSON.parse(
            this.getAttribute("elements").replace(/'/g, '"')
          );
          let elements = "";
          const type = this.getAttribute("type");
          if (type == 3) {
            const elSrc = await readFile("/partials/radios.jsx");
            for (let i = 0; i < this.elements.length; i++) {
              const element = this.elements[i];
              elements += elSrc
                .replace(/{ label }/g, element)
                .replace(/{ parentLabel }/g, this.getAttribute("title"));
            }
          } else if (type == 9) {
            const elSrc = await readFile("/partials/selects.jsx");
            this.value = this.elements[0];
            for (let i = 0; i < this.elements.length; i++) {
              const element = this.elements[i];
              elements += elSrc.replace(/{ label }/g, element);
            }
          }
          this.innerHTML = src
            .replace(/{ label }/g, this.getAttribute("title"))
            .replace(/<elements \/>/g, elements);

          if (!this.hasAttribute("dev")) {
            if (
              type == 0 ||
              type == 1 ||
              type == 2 ||
              type == 6 ||
              type == 7 ||
              type == 8
            ) {
              const elm = this.querySelector("[main]");
              this.value = "";
              elm.oninput = () => {
                this.value = elm.value;
              };
            } else if (type == 3) {
              const elms = this.querySelectorAll(
                'input[name="' + this.getAttribute("title") + '"]'
              );
              for (let i = 0; i < elms.length; i++) {
                const elm = elms[i];
                elm.onclick = () => {
                  this.value = elm.value;
                };
              }
            } else if (type == 4) {
              const elm = this.querySelector("[main]");
              this.value = false;
              elm.onchange = () => {
                this.value = elm.checked;
              };
            } else if (type == 5) {
              const elm = this.querySelector("[main]");
              this.value = "";
              elm.onchange = () => {
                this.value = elm.innerHTML;
              };
            } else if (type == 9) {
              const elm = this.querySelector("[main]");
              elm.onchange = () => {
                this.value = elm.value;
              };
            }
            return;
          }
          this.children[0].innerHTML += (
            await readFile("/partials/delete.jsx")
          ).replace(/{ id }/g, this.getAttribute("id"));
          if (this.getAttribute("required") == "true")
            this.children[0].setAttribute("required", true);
        }
      };
      customElements.define(LOCALS_NAME + "-" + file.split(".")[0], elm);
    }
  };

  const addLink = (href) => {
    const s = d.createElement("link");
    s.setAttribute("href", href);
    s.setAttribute("rel", "stylesheet");
    d.head.appendChild(s);
  };

  const addStyle = (css) => {
    const s = d.createElement("style");
    s.innerHTML = css;
    d.head.appendChild(s);
  };
  const addScript = (src) => {
    const s = d.createElement("script");
    s.src = src;
    d.head.appendChild(s);
  };

  w.initLead = async ({ id, oId }) => {
    try {
      const res = await fetch(
        "https://get-lead.squadora.com/integrate/" + oId + "/" + id,
        {
          mode: "cors",
        }
      );
      if (res.status == 200) {
        addLink(
          "https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/css/bootstrap.min.css"
        );
        addStyle(`
        .card {
          position: absolute;
          top: 30vh;
          left: 50vw;
          transform: translate(-50%, -50%);
          padding: 1rem;
          min-width: 400px;
        }
        label {
          display: block;
        }
        .card button {
          width: min-content;
        }`);
        await defineElements();
      }
      const j = await res.json();
      j.message && alert(j.message);
      j.redirect && redirect(j.redirect);
      const card = d.createElement("div");
      card.classList.add("card");
      const title = d.createElement("h3");
      title.innerHTML = j.title || "";
      card.appendChild(title);
      const des = d.createElement("p");
      des.innerHTML = j.des || "";
      card.appendChild(des);
      j.elements &&
        j.elements.forEach((element) => {
          card.innerHTML += tagify(element.src, false, {
            title: element.title,
            type: element.type,
            elements: JSON.stringify(element.elements || []).replace(/"/g, "'"),
            required: element.required,
          });
        });
      j.callToAction &&
        (card.innerHTML +=
          `<button class="btn btn-primary rounded-0" onclick="const data={};const children=this.parentElement.children;for(let i=0;i<children.length;i++){const child=children[i];if(child.tagName.split('-')[0]!='GL')continue;data[child.getAttribute('title').toLowerCase()]=child.value}submitForm(data, '${id}');">` +
          j.callToAction +
          "</button>");
      document.body.appendChild(card);
      addScript("https://checkout.razorpay.com/v1/checkout.js");
    } catch (err) {
      console.log("Error while fetching", err);
    }
  };
  w.submitForm = async (d, id) => {
    try {
      const res = await fetch(
        "https://get-lead.squadora.com/form/" + id + "/submit",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(d),
        }
      );
      const j = await res.json();
      j.message && alert(j.message);
      j.redirect && redirect(j.redirect);
      if (j.orderId) {
        var options = {
          key: j.key_id, // Enter the Key ID generated from the Dashboard
          amount: j.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
          currency: "INR",
          name: "Squadora",
          description: "sfsef",
          image: "https://www.squadora.com/img/logo.webp",
          order_id: j.orderId, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
          handler: function (response) {
            redirect("/");
          },
          theme: {
            color: "blue",
          },
        };
        var rzp1 = new Razorpay(options);
        rzp1.on("payment.failed", function (response) {
          alert("payment failed");
        });
        rzp1.open();
      }
    } catch (err) {
      console.log("error while fetching", err);
    }
  };
})(document, window);
