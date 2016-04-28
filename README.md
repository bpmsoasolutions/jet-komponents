# jet-komponents
Oracle-jet components used in knockout way.

## Getting started
Install the module with: `bower install jet-komponents`

Add it to your requireJs config:

```javascript
/* ... */
requirejs.config({
    paths: {
        /* ... */
        'jet-komponents': 'libs/jet-komponents/dist/jet-komponents',
        /* ... */
    },
/* ... */
```

Then to register the components, go to your entry point and run our register function.

```javascript
/* ... */
require(['ojs/ojcore', 'knockout', 'jquery', 'jet-komponents'],
    function(oj, ko, $, jetKomponents) {
        jetKomponents.register(ko);
/* ... */
```

Now you can use the components in this way.

```html
<oj-button params="
    click: pauseResumeInterval,
    component:'ojButton', 
    label: 'Application Navigation'
    ">
</oj-button>
```

Instead of this:

```html
<button data-bind="
    click: $parent.toggleDrawer, 
    ojComponent: {
        component:'ojButton', 
        label: 'Application Navigation'
    }">
</button>
```



## Documentation
This first version of the library borns to cover our needs, to have a better experience with jet. Right now is a wrapper for at least this components (more components will be added):

```javascript
['ojInputText', 'ojInputPassword', 'ojInputNumber', 'ojInputDateTime',  'ojSlider', 'ojCombobox', 'ojInputSearch', 'ojSwitch', 'ojTextArea', 'ojSelect', 'ojCheckboxset', 'ojRadioSet','ojToolbar', 'ojLedGauge', 'ojDiagram','ojLegend', 'ojNBox', 'ojPictoChart', 'ojButtonset','ojMenu', 'ojListView', 'ojDialog', 'ojButton', 'ojNavigationList', 'ojChart']
```

**Remember that you must import the component you want in your requireJs, this is only a wrapper over Jet.**

## Examples

**Select** (ojs/ojselect)

```html
<oj-select params="
    multiple: true,
    value: selectedFields,
    options: listOfFields,
    rootAttributes: {
    id: 'multiselect',
        style:'max-width:100%'
    }">
</oj-select>
```

**Button** (ojs/ojbutton)

```html
<oj-button params="
    click: addGraphs,
    label:'Add',
    rootAttributes: {
        style: 'float:right'
    }">
</oj-button>
```

**Chart** (ojs/ojchart)

```html
<oj-chart params="
    series: widget.data,
    groups: $parent.lineGroups,
    rootAttributes:{
        style: 'width:100%;height:350px;'
    }">
</oj-chart>
```

**Navigation List** (ojs/ojnavigationlist)

```html
<oj-navigation-list params="
    optionChange: $parent.navChange,
    item: {template: 'navTemplate'},
    data: $parent.navDataSource,
    selection: $parent.router.stateId(),
    edge: 'top',
    rootAttributes:{
        class:'oj-web-applayout-navbar oj-sm-only-hide oj-web-applayout-max-width oj-navigationlist-item-dividers oj-md-condense oj-md-justify-content-center oj-lg-justify-content-flex-end'
    }">
</oj-navigation-list>
```

**Dialog** (ojs/ojdialog)

```html
<oj-dialog params="rootAttributes: { style: 'width: 620px;height: 350px;'}, title: 'Project configuration', id: 'config'">
    <div class="oj-dialog-body">
      <!-- ... -->
    </div>
    <div class="oj-dialog-footer">
        <oj-button params="click: closeModal, label: 'Close'"></oj-button>
    </div>
</oj-dialog>
```

**List view** (ojs/ojlistview)

```html
<oj-list-view params="
    selectionMode: 'single',
    data: fieldsTable,
    selection: selectionField,
    item: {template: 'list_template'},
    rootAttributes: {
        id: 'listview'
    }">
</oj-list-view>
```

**Input** (ojs/ojinput)

```html
<oj-input-text params="
    value: searchValue,
    rootAttributes: {
        style: 'max-width:25em',
        id: 'search-word'
    }">
</oj-input-text>
```

# Release History

## (0.5.0)
- First release i will update soon, stay tuned!
- Components:
  - ojInputText
  - ojInputPassword
  - ojInputNumber
  - ojInputDateTime
  - ojSlider
  - ojCombobox
  - ojInputSearch
  - ojSwitch
  - ojTextArea
  - ojSelect
  - ojCheckboxset
  - ojRadioSet
  - ojToolbar
  - ojLedGauge
  - ojDiagram
  - ojLegend
  - ojNBox
  - ojPictoChart
  - ojButtonset
  - ojMenu
  - ojListView
  - ojDialog
  - ojButton
  - ojNavigationList
  - ojChart




## License

Licensed under the MIT license. 2016 bpmsoasolutions.com

