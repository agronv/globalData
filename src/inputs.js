import countries from './countries.js';
import products from './products.js'; 

export default class Inputs {
  constructor(scene, container, arcs, loading, noData) {
    this.scene = scene;
    this.arcs = arcs;
    this.noData = noData;
    this.loading = loading;
    this.maxYear = 2020;
    this.currentYear = this.maxYear.toString();
    this.container = container;
    this.currentCountry = "840";
    this.currentProduct = "17";
    this.importKey = "3276712c644c4f40a36307cb0a85cc12";
    this.exportKey = "1d2f950c11dd423e84a787e5c4ed9981";
    this.proxyUrl = "https://corsproxyglobe.herokuapp.com/";
    this.isFetching = false;
    this.isFetchAgain = false;
    this.popularCountries = [
      { id: "840", name: "United States of America" },
      { id: "156", name: "China" },
      { id: "276", name: "Germany" },
      { id: "392", name: "Japan" },
      { id: "826", name: "United Kingdom" },
      { id: "250", name: "France" },
      { id: "528", name: "Netherlands" },
      { id: "344", name: "Hong Kong, China" },
      { id: "410", name: "South Korea" },
      { id: "356", name: "India" },
      { id: "784", name: "United Arab Emirates" }
    ]
    this.popularProducts = [
      { id: "8703", name: "Cars" },
      { id: "8708", name: "Car parts" },
      { id: "2709", name: "Crude petroleum oils" },
      { id: "30", name: "Pharmaceutical products" },
      { id: "2711", name: "Petroleum gases" },
      { id: "17", name: "Sugar" },
      { id: "0901", name: "Coffee" },
      { id: "39", name: "Plastics" },
      { id: "44", name: "Wood" },
      { id: "8504", name: "Electric transformers" },
      { id: "847130", name: "Central processing unit" }
    ]

    this.yearList = document.getElementById('years-list');
    this.yearInput = document.getElementById("year-input");
    this.searchTitle = document.getElementById("search-query");
    this.productsList = document.getElementById('products-list');
    this.productInput = document.getElementById("product-input");
    this.countryInput = document.getElementById("country-input");
    this.countriesList = document.getElementById('countries-list');

    this.fetchYear = this.fetchYear.bind(this);
    this.removeLists = this.removeLists.bind(this);
    this.fetchProduct = this.fetchProduct.bind(this);
    this.fetchCountry = this.fetchCountry.bind(this);
    this.onCountryKeyDown = this.onCountryKeyDown.bind(this);
    this.onProductKeyDown = this.onProductKeyDown.bind(this);
    this.yearInputListener = this.yearInputListener.bind(this);
    this.countryInputClick = this.countryInputClick.bind(this);
    this.productInputClick = this.productInputClick.bind(this);
    this.countryInputListener = this.countryInputListener.bind(this);
    this.productInputListener = this.productInputListener.bind(this);

    this.container.addEventListener("mouseup", this.removeLists);
    this.yearInput.addEventListener("input", this.yearInputListener);
    this.countryInput.addEventListener("click", this.countryInputClick);
    this.productInput.addEventListener("click", this.productInputClick);
    this.countryInput.addEventListener("input", this.countryInputListener);
    this.productInput.addEventListener("input", this.productInputListener);
    this.countryInput.addEventListener("keydown", (e) => { if (e.keyCode === 38 || e.keyCode === 40) e.preventDefault();});
    this.productInput.addEventListener("keydown", (e) => { if (e.keyCode === 38 || e.keyCode === 40) e.preventDefault();});

    this.initialize();
  }

  initialize() {
    let yearLi;
    for (let i = this.maxYear-20; i <= this.maxYear; i++) {
      yearLi = document.getElementById(`year-${i}`)
      if (i === this.maxYear) yearLi.className += "active";
      yearLi.addEventListener("click", this.fetchYear);
    }

    this.countryInput.value = countries[this.currentCountry].name;
    this.productInput.value = products[this.currentProduct].name;
    this.searchTitle.innerText = `${countries[this.currentCountry].name} - ${products[this.currentProduct].name}`;

    this.fetchData(true);
  }

  fetchCountry(e) {
    e.preventDefault();
    this.currentCountry = e.target.id;
    this.countryInput.value = countries[this.currentCountry].name;
    while (this.countriesList.firstChild) {
      this.countriesList.removeChild(this.countriesList.firstChild);
    }
    this.fetchData();
  }

  fetchProduct(e) {
    e.preventDefault();
    this.currentProduct = e.target.id;
    this.productInput.value = products[this.currentProduct].name;
    while (this.productsList.firstChild) {
      this.productsList.removeChild(this.productsList.firstChild);
    }
    this.fetchData();
  }

  fetchYear(e) {
    e.preventDefault();
    let formerActive = document.getElementsByClassName("active");
    if (formerActive.length > 0) formerActive[0].className = "";
    this.yearInput.value = e.target.id.split("-")[1];
    this.currentYear = e.target.id.split("-")[1];
    e.target.className += "active";
    this.fetchData();
  }

  fetchy(url, key) {
    return fetch(url, {headers: {'Ocp-Apim-Subscription-Key': key}}).then(response => response.json())
  }

  async fetchData(isInitialLoad = false) {
    if (this.isFetching) return this.isFetchAgain = true;
    this.isFetching = true;

    this.loading.className = isInitialLoad ? "" : "loader";
    this.noData.className = "";
    this.searchTitle.innerText = `${countries[this.currentCountry].name} - ${products[this.currentProduct].name}`;

    for (let i = this.scene.children.length - 1; i > 0; i--) {
      this.scene.remove(this.scene.children[i]);
    }

    const importUrl = `https://api.wto.org/timeseries/v1/data?i=HS_M_0010&r=${this.currentCountry}&p=default&ps=${this.currentYear}&pc=${this.currentProduct}&mode=codes&dec=4`;
    const exportUrl = `https://api.wto.org/timeseries/v1/data?i=HS_M_0010&r=all&p=${this.currentCountry}&ps=${this.currentYear}&pc=${this.currentProduct}&mode=codes&dec=4`;

    const imports = await this.fetchy(importUrl, this.importKey);
    const exports = await this.fetchy(exportUrl, this.exportKey);

    if (this.isFetchAgain) {
      this.isFetchAgain = false;
      this.isFetching = false;
      this.fetchData();
    } else {
      this.isFetching = false;

      this.loading.className = "";

      let importData = imports && imports.Dataset ? imports.Dataset : [];
      let exportData = exports && exports.Dataset ? exports.Dataset : [];
  
      this.arcs.createArcs(importData, exportData, this.currentCountry);
    }
  }

  generateSearch(key, data) {
    let result = [];
    let value;
    Object.values(data).forEach(dataPoint => {
      value = this.stringKeyValue(dataPoint.name, key);
      if (value) {
        result.push({ value: value, name: dataPoint.name, id: dataPoint.id
        });
      }
    });
    return this.quickSort(result);
  }

  countryInputListener(e) {
    window.removeEventListener("keydown", this.onProductKeyDown);
    window.addEventListener("keydown", this.onCountryKeyDown);
    this.inputListener(e, this.countriesList, countries, this.fetchCountry);
  }

  productInputListener(e) {
    window.removeEventListener("keydown", this.onCountryKeyDown);
    window.addEventListener("keydown", this.onProductKeyDown);
    this.inputListener(e, this.productsList, products, this.fetchProduct);
  }

  inputListener(e, list, data, callBack) {
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }
    let dataLis = this.generateSearch(e.target.value, data);
    this.renderItems(dataLis, list, callBack);
  }

  renderItems(dataLis, list, callBack) {
    let dataLi;
    dataLis.forEach((item) => {
      dataLi = document.createElement('li');
      dataLi.appendChild(document.createTextNode(item.name));
      dataLi.setAttribute("id", item.id);
      dataLi.classList.add("list-item");
      list.appendChild(dataLi);
      dataLi.addEventListener("click", callBack);
    });
  }

  yearInputListener(e) {
    e.preventDefault();
    let formerActive = document.getElementsByClassName("active");
    if (formerActive.length > 0) formerActive[0].className = "";
    let yearLi = document.getElementById(`year-${e.target.value}`);
    yearLi.className += "active";
    this.currentYear = e.target.value;
    this.fetchData();
  }

  removeLists(e) {
    e.preventDefault();
    while (this.countriesList.firstChild) {
      this.countriesList.removeChild(this.countriesList.firstChild);
    }
    while (this.productsList.firstChild) {
      this.productsList.removeChild(this.productsList.firstChild);
    }
    this.countryInput.value = countries[this.currentCountry].name;
    this.productInput.value = products[this.currentProduct].name;
  }

  productInputClick() {
    this.productInput.value = "";
    this.countryInput.value = countries[this.currentCountry].name;
    this.listIndex = null;
    while (this.countriesList.firstChild) {
      this.countriesList.removeChild(this.countriesList.firstChild);
    }
    this.renderItems(this.popularProducts, this.productsList, this.fetchProduct);
    window.removeEventListener("keydown", this.onCountryKeyDown);
    window.addEventListener("keydown", this.onProductKeyDown);
  }

  countryInputClick() {
    this.countryInput.value = "";
    this.productInput.value = products[this.currentProduct].name;
    this.listIndex = null;
    while (this.productsList.firstChild) {
      this.productsList.removeChild(this.productsList.firstChild);
    }
    this.renderItems(this.popularCountries, this.countriesList, this.fetchCountry);
    window.removeEventListener("keydown", this.onProductKeyDown);
    window.addEventListener("keydown", this.onCountryKeyDown);
  }

  onCountryKeyDown(e) {
    this.onKeyDown(e, this.countriesList, this.countryInput, 'country', this.onCountryKeyDown);
  }

   onProductKeyDown(e) {
    this.onKeyDown(e, this.productsList, this.productInput, 'product', this.onProductKeyDown);
  }

  onKeyDown(e, list, input, editorType, callBack) {
    if (list.childElementCount && [40, 13, 38].includes(e.keyCode)) {
      if (e.keyCode === 40) {
        this.onArrowKey(list, input, false);
      }
      else if (e.keyCode === 38) {
        this.onArrowKey(list, input, true);
      }
      else if (e.keyCode === 13) {
        this.onEnter(editorType, list, input, callBack)
      }

    } else if (e.valueOf().key && e.valueOf().key.length === 1) {
      this.listIndex = null;
    }
  }

  onArrowKey(list, input, isUpArrow) {
    if (this.listIndex === null) {
      this.listIndex = isUpArrow ? list.childElementCount - 1 : 0;
    } else {
      list.children[this.listIndex].classList.remove("active-item");
      this.listIndex = isUpArrow ? this.listIndex - 1 : this.listIndex + 1;

      this.listIndex = this.listIndex % list.childElementCount;
      if (this.listIndex < 0) this.listIndex = list.childElementCount - 1;
    }
    list.children[this.listIndex].classList.add("active-item");
    input.value = list.children[this.listIndex].innerText;

    list.children[this.listIndex].scrollIntoView({
      behavior: 'auto',
      block: 'center'
    })
  }

  onEnter(editorType, list, input, callBack) {
    let potentialId = this.findMatchingId(list, input)
    if (this.listIndex !== null || potentialId) {
      window.removeEventListener("keydown", callBack);
      if (editorType === 'product') {
        this.currentProduct = potentialId || list.children[this.listIndex].id;
      } else {
        this.currentCountry = potentialId || list.children[this.listIndex].id;
      }
      while (list.firstChild) {
        list.removeChild(list.firstChild);
      }
      this.fetchData();
    }
    this.listIndex = null;
  }

  findMatchingId(list, input) {
    for (let i = 0; i < list.children.length; i++ ) {
      if (list.children[i].innerText.toLowerCase() === input.value.toLowerCase()) {
        return list.children[i].id
      }
    }
    return false
  }

  stringKeyValue(string, key) {
    let stringIdx = 0;
    let keyIdx = 0;
    let value = string.length === key.length ? 1 : 0;
    let multiplier = 2;

    function _stringKeyValue() {
      if (keyIdx === key.length) return value;
      if (stringIdx === string.length) return value > 4 ? value : 0;
      if (string[stringIdx].toLowerCase() === key[keyIdx].toLowerCase()) {
        value += multiplier;
        multiplier *= 2;
        keyIdx++;
      }
      else {
        multiplier = Math.floor(multiplier / 2) || 1;
      }
      stringIdx++;
      return _stringKeyValue();
    }

    return _stringKeyValue();
  }

  quickSort(arr) {
    if (arr.length <= 0) return arr;
    let middle = arr[0];

    let left = [];
    let right = [];
    let middler = [];

    arr.forEach( product => {
      if (product.value < middle.value) right.push(product);
      else if (product.value === middle.value) middler.push(product);
      else left.push(product);
    });

    const leftSorted = this.quickSort(left);
    const rightSorted = this.quickSort(right);

    return leftSorted.concat(middler, rightSorted);
  }
}
