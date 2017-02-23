/* 
 * Angular JS Multi Select
 * Creates a dropdown-like button with checkboxes. 
 *
 * Project started on: Tue, 14 Jan 2014 - 5:18:02 PM
 * Current version: 4.0.0
 * 
 * Released under the MIT License
 * --------------------------------------------------------------------------------
 * The MIT License (MIT)
 *
 * Copyright (c) 2014 Ignatius Steven (https://github.com/isteven)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy 
 * of this software and associated documentation files (the "Software"), to deal 
 * in the Software without restriction, including without limitation the rights 
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell 
 * copies of the Software, and to permit persons to whom the Software is 
 * furnished to do so, subject to the following conditions: 
 *
 * The above copyright notice and this permission notice shall be included in all 
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE 
 * SOFTWARE.
 * --------------------------------------------------------------------------------
 */

// 'use strict';

angular.module('isteven-multi-select', ['ng']).directive('istevenMultiSelect', ['$sce', '$timeout', '$templateCache', '$http', '$q', function($sce, $timeout, $templateCache, $http, $q) {
    return {
        restrict: 'AE',

        scope: {
            // models
            // inputModel: '=',
            outputModel: '=',
            selectedData: '=',
            filterUrl: '@',
            otherFilterData: '=',
            selectorId: '@',

            // settings based on attribute
            isDisabled: '=',

            // callbacks
            onClear: '&',
            onClose: '&',
            onSearchChange: '&',
            onItemClick: '&',
            onOpen: '&',
            onReset: '&',
            onSelectAll: '&',
            onSelectNone: '&',

            // i18n
            translation: '='
        },

        /* 
         * The rest are attributes. They don't need to be parsed / binded, so we can safely access them by value.
         * - buttonLabel, directiveId, helperElements, itemLabel, maxLabels, orientation, selectionMode, minSearchLength,
         *   tickProperty, disableProperty, groupProperty, searchProperty, maxHeight, outputProperties
         */

        templateUrl: 'isteven-multi-select.htm',

        link: function($scope, element, attrs) {

            $scope.backUp = [];
            $scope.varButtonLabel = '';
            $scope.spacingProperty = '';
            $scope.indexProperty = '';
            $scope.orientationH = false;
            $scope.orientationV = true;
            $scope.filteredModel = [];
            $scope.inputLabel = { labelFilter: '' };
            $scope.tabIndex = 0;
            $scope.lang = {};
            $scope.connectService = false;
            $scope.inputModel = [];
            $scope.helperStatus = {
                all: true,
                none: true,
                reset: true,
                filter: true
            };

            var
                prevTabIndex = 0,
                helperItems = [],
                helperItemsLength = 0,
                checkBoxLayer = '',
                scrolled = false,
                selectedItems = [],
                formElements = [],
                vMinSearchLength = 0,
                clickedItem = null,
                startTime;

            // v3.0.0
            // clear button clicked
            $scope.clearClicked = function(e) {
                $scope.inputLabel.labelFilter = '';
                // $scope.updateFilter();
                $scope.select('clear', e);
            };

            $scope.$watch('otherFilterData', function(oldVal, newVal) {
                if (newVal !== oldVal) {
                    $scope.refreshOutputModel();
                    $scope.refreshButton();
                    $scope.filter();
                }
            }, true);

            /**
             * get other filter data from page attribute
             * it can set multiple object
             * data formate is like {merchantid: selectedMerchants, custid: selectedCustomers}
             **/
            function getOtherFilterData() {
                if(typeof $scope.otherFilterData !== 'undefined') {
                    var filter = '';
                    $scope.bean.filterBy = '';
                    for(var key in $scope.otherFilterData) {
                        if(key != null && key !== '') {
                            if(key.toUpperCase().indexOf('MERCHANT') >= 0) {
                                filter = 'merchantid';
                            } else if(key.toUpperCase().indexOf('CUST') >= 0) {
                                filter = 'custid';
                            } else if(key.toUpperCase().indexOf('PURCHASEIN') >= 0) {
                                filter = 'purchaseinid';
                            }
                        }
                        var value = $scope.otherFilterData[key];
                        if(typeof value !== 'undefined') {
                            if(typeof value === 'object') {
                                if(value.length > 0) {
                                    $scope.bean.filterBy += ' AND `' + filter + '` in (';
                                    for(var i = 0, len = value.length; i < len; i++) {
                                        $scope.bean.filterBy += '"' + (value[i].id?value[i].id:value[i].name) + '"';
                                    }
                                    $scope.bean.filterBy += ')';
                                }
                            } else {
                                $scope.bean.filterBy += ' AND `' + filter + '` = "' + value + '"';
                            }
                        }
                    }
                }
            }

            /**
             * tick the item in selectedData
             **/
            function setDefaultTickedData() {
                if($scope.selectedData != null && $scope.selectedData.length > 0) { // currently we have not yet handle the number types, TODO
                    var postBean = {};
                    postBean.filterBy = $scope.selectedData;
                    if($scope.selectorId != null && $scope.selectorId !== '') {
                        if($scope.selectorId.toUpperCase().indexOf('MERCHANT') >= 0) {
                            postBean.DBObj = 'Merchant';
                        } else if($scope.selectorId.toUpperCase().indexOf('CUST') >= 0) {
                            postBean.DBObj = 'Customer';
                        } else if($scope.selectorId.toUpperCase().indexOf('VENDOR') >= 0) {
                            postBean.DBObj = 'Vendor';
                        } else if($scope.selectorId.toUpperCase().indexOf('ENGINEER') >= 0) {
                            postBean.DBObj = 'User';
                        } else if($scope.selectorId.toUpperCase().indexOf('PURCHASEIN') >= 0) {
                            postBean.DBObj = 'PurchaseIn';
                        }
                    }
                    postBean.need = attrs.buttonLabel;
                    $http.post('/admin/multiselector/setdefaultticked', postBean)
                    .success(function(data, status, headers, config) {
                        if (data.status === 'success') {
                            $scope.message = data.message;
                            if (!data.data.filterRecord || data.data.filterRecord.length === 0) {
                                return false;
                            }
                            data.data.filterRecord.forEach(function(item) {
                                // outputmodel must contain id and name, so when record is not contain id, should set it
                                var i, len;
                                if(attrs.buttonLabel !== 'id') {
                                    if(typeof $scope.selectedData === 'object') {
                                        for(i = 0, len = $scope.selectedData.length; i < len; i++) {
                                            $scope.outputModel.push({
                                                id: $scope.selectedData[i],
                                                name: item[attrs.buttonLabel],
                                                ticked: true
                                            });
                                            break;
                                        }
                                    } else {
                                        $scope.outputModel.push({
                                            id: $scope.selectedData,
                                            name: item[attrs.buttonLabel],
                                            ticked: true
                                        });
                                    }
                                } else if(attrs.buttonLabel !== 'name'){
                                    if(typeof $scope.selectedData === 'object') {
                                        for(i = 0, len = $scope.selectedData.length; i < len; i++) {
                                            $scope.outputModel.push({
                                                id: item[attrs.buttonLabel],
                                                name: $scope.selectedData[i],
                                                ticked: true
                                            });
                                            break;
                                        }
                                    } else {
                                        $scope.outputModel.push({
                                            id: item[attrs.buttonLabel],
                                            name: $scope.selectedData,
                                            ticked: true
                                        });
                                    }
                                }
                            });
                            // $scope.prepareIndex();
                            $scope.refreshButton();
                        } else {
                            console.error(data.message);
                        }
                        $scope.busy = false;
                    })
                    .error(function(data, status, headers, config) {
                        $scope.busy = false;
                        console.error(data);
                    });
                }
            }

            function tickDefault(model) {
                if(typeof model !== 'undefined' && model.length > 0) {
                    if (typeof $scope.outputModel !== 'undefined' && $scope.outputModel.length > 0) {
                        model.forEach(function(input) {
                            $scope.outputModel.forEach(function(output) {
                                if(input.id === output.id || input.name === output.name) {
                                    input.ticked = true;
                                    $scope.refreshOutputModel();
                                    $scope.refreshButton();
                                    return;
                                }
                            });
                        });
                    }
                }
            }

            $scope.busy = false;

            function getInputModelFromServer() {
                if ((!$scope.inputModel || $scope.inputModel.length <= 0) || ($scope.otherFilterData && $scope.otherFilterData !== $scope.bean.otherFilterData)) {
                    $scope.bean.fromIndex = 0;
                    $scope.bean.flag = 'init';

                    angular.forEach($scope.filteredModel, function(value, key) { // clean up the selected data
                        if (typeof value !== 'undefined' && value[attrs.disableProperty] !== true) {
                            if (typeof value[attrs.groupProperty] === 'undefined') {
                                value[$scope.tickProperty] = false;
                            }
                        }
                    });
                    
                    $scope.bean.otherFilterData = $scope.otherFilterData;

                    getOtherFilterData();

                    $scope.busy = true;
                    $http.post($scope.filterUrl, $scope.bean)
                    .success(function(data, status, headers, config) {
                        if (data.status === 'success') {
                            $scope.message = data.message;
                            if (!data.data.filterRecord || data.data.filterRecord.length === 0) {
                                $scope.inputModel = [];
                                return false;
                            }
                            $scope.inputModel = data.data.filterRecord;
                            $scope.filterInputModel = data.data.filterRecord;
                            tickDefault($scope.filterInputModel);
                            $scope.refreshButton();
                            $scope.prepareIndex();
                        } else {
                            console.error(data.message);
                            $scope.message = data.message;
                        }
                        $scope.busy = false;
                    })
                    .error(function(data, status, headers, config) {
                        $scope.busy = false;
                        console.error(data);
                    });
                } else {
                    $scope.busy = false;
                }
            }

            if (typeof $scope.bean === 'undefined') {
                $scope.bean = {};
            }
            if(typeof attrs.tickProperty === 'undefined') {
                attrs.tickProperty = 'ticked';
            }
            if(typeof $scope.tickProperty === 'undefined') {
                $scope.tickProperty = 'ticked';
            }

            $scope.init = function() {
                if ($scope.filterUrl != null && $scope.filterUrl !== '' && !$scope.busy) {
                    setDefaultTickedData();
                } else {
                    $scope.busy = false;
                }
            };

            $scope.filter = function() {
                if ($scope.filterUrl != null && $scope.filterUrl !== '' && !$scope.busy) {
                    getInputModelFromServer();
                } else {
                    $scope.busy = false;
                }
            };


            // A little hack so that AngularJS ng-repeat can loop using start and end index like a normal loop
            // http://stackoverflow.com/questions/16824853/way-to-ng-repeat-defined-number-of-times-instead-of-repeating-over-array
            $scope.numberToArray = function(num) {
                return new Array(num);
            };

            // Call this function when user type on the filter field
            $scope.searchChanged = function(e) {
                if ($scope.inputLabel.labelFilter.length < vMinSearchLength && $scope.inputLabel.labelFilter.length > 0) {
                    return false;
                }
                $scope.updateFilter();
            };

            $scope.updateFilter = function() {
                // we check by looping from end of input-model
                $scope.filteredModel = [];
                var i = 0;

                if (typeof $scope.inputModel === 'undefined') {
                    return false;
                }

                for (i = $scope.inputModel.length - 1; i >= 0; i--) {
                    $scope.filteredModel.push($scope.inputModel[i]);
                }

                $scope.filteredModel.reverse();
                // modified by sun
                // if($scope.filteredModel == null || $scope.filteredModel === "" || $scope.filteredModel.length === 0){
                if ($scope.filterUrl != null && $scope.filterUrl !== "" && $scope.inputLabel.labelFilter != null && $scope.inputLabel.labelFilter !== "" && !$scope.busy) {
                    $scope.bean = {};
                    $scope.bean['filterName'] = $scope.inputLabel.labelFilter;
                    $scope.bean['flag'] = 'filter';
                    $scope.bean['fromIndex'] = 0;
                    startTime = new Date().getTime();
                    var canceller = $q.defer();
                    if($scope.busy && new Date().getTime - startTime >= 5000) {
                        console.log('get reponse time out');
                        canceller.resolve('get reponse time out'); 
                    }
                    $scope.busy = true;
                    $http.post($scope.filterUrl, $scope.bean, {timeout: canceller.promise})
                    .success(function(data, status, headers, config) {
                        if (data.status === 'success') {
                            $scope.message = data.message;
                            $scope.filteredModel = data.data.filterRecord;
                            // $scope.filterInputModel = data.data.filterRecord;
                            if (!data.data.filterRecord || data.data.filterRecord.length === 0) {
                                return false;
                            }
                            angular.forEach(data.data.filterRecord, function(value, key) {
                                for (var i = 0; i < $scope.filterInputModel.length; i++) {
                                    if ($scope.filterInputModel[i].id === value.id && $scope.filterInputModel[i].name === value.name) {
                                        return;
                                    }
                                }
                                $scope.filterInputModel.push({
                                    id: value.id,
                                    name: value.name
                                });
                            });
                            tickDefault($scope.filteredModel);
                            // $scope.filterInputModel.reverse();
                            $scope.prepareIndex();
                        } else {
                            console.error(data.message);
                            $scope.message = data.message;
                        }
                        $scope.busy = false;
                    })
                    .error(function(data, status, headers, config) {
                        console.error(data);
                        $scope.busy = false;
                    });
                }
                // }

                $timeout(function() {

                    $scope.getFormElements();

                    // Callback: on filter change                      
                    if ($scope.inputLabel.labelFilter.length > vMinSearchLength) {

                        var filterObj = [];

                        angular.forEach($scope.filteredModel, function(value, key) {
                            if (typeof value !== 'undefined') {
                                if (typeof value[attrs.groupProperty] === 'undefined') {
                                    var tempObj = angular.copy(value);
                                    var index = filterObj.push(tempObj);
                                    delete filterObj[index - 1][$scope.indexProperty];
                                    delete filterObj[index - 1][$scope.spacingProperty];
                                }
                            }
                        });

                        $scope.onSearchChange({
                            data: {
                                keyword: $scope.inputLabel.labelFilter,
                                result: filterObj
                            }
                        });
                    }
                }, 0);
            };

            $scope.hasMore = true;
            $scope.loadMore = function() {
                if ($scope.filteredModel.length >= 20) {
                    $scope.bean = {};
                    $scope.bean.fromIndex = $scope.filteredModel.length;
                    $scope.bean.flag = 'scoller';
                    $http.post($scope.filterUrl, $scope.bean)
                    .success(function(data, status, headers, config) {
                        if (data.status === 'success') {
                            $scope.message = data.message;
                            if (!data.data.filterRecord || data.data.filterRecord.length === 0) {
                                $scope.hasMore = false;
                                return false;
                            }
                            if (data.data.filterRecord.length < 20) {
                                $scope.hasMore = false;
                            }
                            angular.forEach(data.data.filterRecord, function(value, key) {
                                $scope.filterInputModel.push({
                                    id: value.id,
                                    name: value.name
                                });
                            });
                            // $scope.inputModel = $scope.filterInputModel;
                            $scope.filteredModel = $scope.filterInputModel;
                            tickDefault($scope.filteredModel);
                            $scope.prepareIndex();
                        } else {
                            console.error(data.message);
                            $scope.message = data.message;
                        }
                    })
                    .error(function(data, status, headers, config) {
                        console.error(data);
                    });
                }
            };

            // List all the input elements. We need this for our keyboard navigation.
            // This function will be called everytime the filter is updated. 
            // Depending on the size of filtered mode, might not good for performance, but oh well..
            $scope.getFormElements = function() {
                formElements = [];

                var
                    selectButtons = [],
                    inputField = [],
                    checkboxes = [],
                    clearButton = [];

                // If available, then get select all, select none, and reset buttons
                if ($scope.helperStatus.all || $scope.helperStatus.none || $scope.helperStatus.reset) {
                    selectButtons = element.children().children().next().children().children()[0].getElementsByTagName('button');
                    // If available, then get the search box and the clear button
                    if ($scope.helperStatus.filter) {
                        // Get helper - search and clear button. 
                        inputField = element.children().children().next().children().children().next()[0].getElementsByTagName('input');
                        clearButton = element.children().children().next().children().children().next()[0].getElementsByTagName('button');
                    }
                } else {
                    if ($scope.helperStatus.filter) {
                        // Get helper - search and clear button. 
                        inputField = element.children().children().next().children().children()[0].getElementsByTagName('input');
                        clearButton = element.children().children().next().children().children()[0].getElementsByTagName('button');
                    }
                }

                // Get checkboxes
                if (!$scope.helperStatus.all && !$scope.helperStatus.none && !$scope.helperStatus.reset && !$scope.helperStatus.filter) {
                    checkboxes = element.children().children().next()[0].getElementsByTagName('input');
                } else {
                    checkboxes = element.children().children().next().children().next()[0].getElementsByTagName('input');
                }

                // Push them into global array formElements[] 
                for (var a = 0; a < selectButtons.length; a++) { formElements.push(selectButtons[a]); }
                for (var b = 0; b < inputField.length; b++) { formElements.push(inputField[b]); }
                for (var c = 0; c < clearButton.length; c++) { formElements.push(clearButton[c]); }
                for (var d = 0; d < checkboxes.length; d++) { formElements.push(checkboxes[d]); }
            };

            // check if an item has attrs.groupProperty (be it true or false)
            $scope.isGroupMarker = function(item, type) {
                if (typeof item[attrs.groupProperty] !== 'undefined' && item[attrs.groupProperty] === type) {
                    return true;
                }
                return false;
            };

            $scope.removeGroupEndMarker = function(item) {
                if (typeof item[attrs.groupProperty] !== 'undefined' && item[attrs.groupProperty] === false) {
                    return false;
                }
                return true;
            };

            // call this function when an item is clicked
            $scope.syncItems = function(item, e, ng_repeat_index) {

                e.preventDefault();
                e.stopPropagation();

                // if the directive is globaly disabled, do nothing
                if (typeof attrs.disableProperty !== 'undefined' && item[attrs.disableProperty] === true) {
                    return false;
                }

                // if item is disabled, do nothing
                if (typeof attrs.isDisabled !== 'undefined' && $scope.isDisabled === true) {
                    return false;
                }

                // if end group marker is clicked, do nothing
                if (typeof item[attrs.groupProperty] !== 'undefined' && item[attrs.groupProperty] === false) {
                    return false;
                }

                var index = $scope.filteredModel.indexOf(item);

                // if the start of group marker is clicked ( only for multiple selection! )
                // how it works:
                // - if, in a group, there are items which are not selected, then they all will be selected
                // - if, in a group, all items are selected, then they all will be de-selected                
                if (typeof item[attrs.groupProperty] !== 'undefined' && item[attrs.groupProperty] === true) {

                    // this is only for multiple selection, so if selection mode is single, do nothing
                    if (typeof attrs.selectionMode !== 'undefined' && attrs.selectionMode.toUpperCase() === 'SINGLE') {
                        return false;
                    }

                    var i, j, k;
                    var startIndex = 0;
                    var endIndex = $scope.filteredModel.length - 1;
                    var tempArr = [];

                    // nest level is to mark the depth of the group.
                    // when you get into a group (start group marker), nestLevel++
                    // when you exit a group (end group marker), nextLevel--
                    var nestLevel = 0;

                    // we loop throughout the filtered model (not whole model)
                    for (i = index; i < $scope.filteredModel.length; i++) {

                        // this break will be executed when we're done processing each group
                        if (nestLevel === 0 && i > index) {
                            break;
                        }

                        if (typeof $scope.filteredModel[i][attrs.groupProperty] !== 'undefined' && $scope.filteredModel[i][attrs.groupProperty] === true) {

                            // To cater multi level grouping
                            if (tempArr.length === 0) {
                                startIndex = i + 1;
                            }
                            nestLevel = nestLevel + 1;
                        }

                        // if group end
                        else if (typeof $scope.filteredModel[i][attrs.groupProperty] !== 'undefined' && $scope.filteredModel[i][attrs.groupProperty] === false) {

                            nestLevel = nestLevel - 1;

                            // cek if all are ticked or not                            
                            if (tempArr.length > 0 && nestLevel === 0) {

                                var allTicked = true;

                                endIndex = i;

                                for (j = 0; j < tempArr.length; j++) {
                                    if (typeof tempArr[j][$scope.tickProperty] !== 'undefined' && tempArr[j][$scope.tickProperty] === false) {
                                        allTicked = false;
                                        break;
                                    }
                                }
                                var inputModelIndex;
                                if (allTicked === true) {
                                    for (j = startIndex; j <= endIndex; j++) {
                                        if (typeof $scope.filteredModel[j][attrs.groupProperty] === 'undefined') {
                                            if (typeof attrs.disableProperty === 'undefined') {
                                                $scope.filteredModel[j][$scope.tickProperty] = false;
                                                // we refresh input model as well
                                                inputModelIndex = $scope.filteredModel[j][$scope.indexProperty];
                                                $scope.inputModel[inputModelIndex][$scope.tickProperty] = false;
                                            } else if ($scope.filteredModel[j][attrs.disableProperty] !== true) {
                                                $scope.filteredModel[j][$scope.tickProperty] = false;
                                                // we refresh input model as well
                                                inputModelIndex = $scope.filteredModel[j][$scope.indexProperty];
                                                $scope.inputModel[inputModelIndex][$scope.tickProperty] = false;
                                            }
                                        }
                                    }
                                } else {
                                    for (j = startIndex; j <= endIndex; j++) {
                                        if (typeof $scope.filteredModel[j][attrs.groupProperty] === 'undefined') {
                                            if (typeof attrs.disableProperty === 'undefined') {
                                                $scope.filteredModel[j][$scope.tickProperty] = true;
                                                // we refresh input model as well
                                                inputModelIndex = $scope.filteredModel[j][$scope.indexProperty];
                                                $scope.inputModel[inputModelIndex][$scope.tickProperty] = true;

                                            } else if ($scope.filteredModel[j][attrs.disableProperty] !== true) {
                                                $scope.filteredModel[j][$scope.tickProperty] = true;
                                                // we refresh input model as well
                                                inputModelIndex = $scope.filteredModel[j][$scope.indexProperty];
                                                $scope.inputModel[inputModelIndex][$scope.tickProperty] = true;
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        // if data
                        else {
                            tempArr.push($scope.filteredModel[i]);
                        }
                    }
                }

                // if an item (not group marker) is clicked
                else {

                    // If it's single selection mode
                    if (typeof attrs.selectionMode !== 'undefined' && attrs.selectionMode.toUpperCase() === 'SINGLE') {

                        // first, set everything to false
                        for (var a = 0; a < $scope.filteredModel.length; a++) {
                            $scope.filteredModel[a][$scope.tickProperty] = false;
                        }
                        for (var b = 0; b < $scope.inputModel.length; b++) {
                            $scope.inputModel[b][$scope.tickProperty] = false;
                        }

                        // then set the clicked item to true
                        $scope.filteredModel[index][$scope.tickProperty] = true;
                    }

                    // Multiple
                    else {
                        $scope.filteredModel[index][$scope.tickProperty] = !$scope.filteredModel[index][$scope.tickProperty];
                    }

                    // we refresh input model as well
                    angular.forEach($scope.inputModel, function(value, key) {
                        if (value['name'] === item.name) {
                            value[$scope.tickProperty] = $scope.filteredModel[index][$scope.tickProperty];
                        }
                    });
                }

                // we execute the callback function here
                clickedItem = angular.copy(item);
                if (clickedItem !== null) {
                    $timeout(function() {
                        delete clickedItem[$scope.indexProperty];
                        delete clickedItem[$scope.spacingProperty];
                        $scope.onItemClick({ data: clickedItem });
                        clickedItem = null;
                    }, 0);
                }

                $scope.refreshOutputModel();
                $scope.refreshButton();

                // We update the index here
                prevTabIndex = $scope.tabIndex;
                $scope.tabIndex = ng_repeat_index + helperItemsLength;

                // Set focus on the hidden checkbox 
                e.target.focus();

                // set & remove CSS style
                $scope.removeFocusStyle(prevTabIndex);
                $scope.setFocusStyle($scope.tabIndex);

                if (typeof attrs.selectionMode !== 'undefined' && attrs.selectionMode.toUpperCase() === 'SINGLE') {
                    // on single selection mode, we then hide the checkbox layer
                    $scope.toggleCheckboxes(e);
                }
            };

            $scope.removeSelected = function(itemId, e) {
                e.preventDefault();
                e.stopPropagation();
                if ($scope.outputModel.length === 0 || $scope.outputModel == null) {
                    return;
                }
                if (typeof itemId === 'undefined' || itemId === '') {
                    return;
                }

                for (var i = 0; i < $scope.filterInputModel.length; i++) {
                    if ($scope.filterInputModel[i]['id'] === itemId && $scope.filterInputModel[i][$scope.tickProperty] === true) {
                        $scope.filterInputModel[i][$scope.tickProperty] = false;
                        break;
                    }
                }
                for (var j = 0; j < $scope.filteredModel.length; j++) {
                    if ($scope.filteredModel[j]['id'] === itemId && $scope.filteredModel[j][$scope.tickProperty] === true) {
                        $scope.filteredModel[j][$scope.tickProperty] = false;
                        break;
                    }
                }
                $scope.refreshOutputModel();
                if ($scope.outputModel.length === 0) {
                    $scope.refreshButton();
                }
            };

            // update $scope.outputModel
            $scope.refreshOutputModel = function() {

                $scope.outputModel = [];
                var
                    outputProps = [],
                    tempObj = {};

                // if (!$scope.filterInputModel || $scope.filterInputModel.length === 0) {
                $scope.filterInputModel = $scope.inputModel;
                // }
                // v4.0.0
                if (typeof attrs.outputProperties !== 'undefined') {
                    outputProps = attrs.outputProperties.split(' ');
                    angular.forEach($scope.filterInputModel, function(value, key) {
                        if (
                            typeof value !== 'undefined' && typeof value[attrs.groupProperty] === 'undefined' && value[$scope.tickProperty] === true
                        ) {
                            tempObj = {};
                            angular.forEach(value, function(value1, key1) {
                                if (outputProps.indexOf(key1) > -1) {
                                    tempObj[key1] = value1;
                                }
                            });
                            var index = $scope.outputModel.push(tempObj);
                            delete $scope.outputModel[index - 1][$scope.indexProperty];
                            delete $scope.outputModel[index - 1][$scope.spacingProperty];
                        }
                    });
                } else {
                    angular.forEach($scope.filterInputModel, function(value, key) {
                        if (
                            typeof value !== 'undefined' && typeof value[attrs.groupProperty] === 'undefined' && value[$scope.tickProperty] === true
                        ) {
                            var temp = angular.copy(value);
                            var index = $scope.outputModel.push(temp);
                            delete $scope.outputModel[index - 1][$scope.indexProperty];
                            delete $scope.outputModel[index - 1][$scope.spacingProperty];
                        }
                    });
                }
            };

            // refresh button label
            $scope.refreshButton = function() {
                $scope.varButtonLabel = "";
                var ctr = 0;

                // refresh button label...
                if (typeof $scope.outputModel === 'undefined' || $scope.outputModel.length === 0) {
                    // https://github.com/isteven/angular-multi-select/pull/19                    
                    $scope.varButtonLabel = $scope.lang.nothingSelected;
                } else {
                    var tempMaxLabels = 1;
                    if (typeof attrs.maxLabels !== 'undefined' && attrs.maxLabels !== '') {
                        tempMaxLabels = attrs.maxLabels;
                    }

                    // if max amount of labels displayed..
                    if ($scope.outputModel.length > tempMaxLabels) {
                        $scope.more = true;
                    } else {
                        $scope.more = false;
                    }
                    //modified by sun
                    angular.forEach($scope.outputModel, function(value, key) {
                        if (typeof value !== 'undefined' && value[attrs.tickProperty] === true) {
                            if (ctr < tempMaxLabels) {
                                $scope.varButtonLabel += ($scope.varButtonLabel.length > 0 ? '</div>, <div class="buttonLabel text-left">' : '<div class="buttonLabel  text-left">') + $scope.writeLabel(value, 'buttonLabel');
                            }
                            ctr++;
                        }
                    });

                    if ($scope.more === true) {
                        // https://github.com/isteven/angular-multi-select/pull/16
                        if (tempMaxLabels > 0) {
                            $scope.varButtonLabel += ', ... ';
                        }
                        $scope.varButtonLabel += '等' + $scope.outputModel.length + '项&nbsp;&nbsp;&nbsp;';
                    }
                }
                $scope.varButtonLabel = $sce.trustAsHtml($scope.varButtonLabel + '<span class="caret"></span>');
            };

            // Check if a checkbox is disabled or enabled. It will check the granular control (disableProperty) and global control (isDisabled)
            // Take note that the granular control has higher priority.
            $scope.itemIsDisabled = function(item) {

                if (typeof attrs.disableProperty !== 'undefined' && item[attrs.disableProperty] === true) {
                    return true;
                } else {
                    if ($scope.isDisabled === true) {
                        return true;
                    } else {
                        return false;
                    }
                }

            };

            // A simple function to parse the item label settings. Used on the buttons and checkbox labels.
            $scope.writeLabel = function(item, type) {

                // type is either 'itemLabel' or 'buttonLabel'
                var temp = attrs[type].split(' ');
                var label = '';

                angular.forEach(temp, function(value, key) {
                    if (item[value]) {
                        label += '&nbsp;' + value.split('.').reduce(function(prev, current) {
                            return prev[current];
                        }, item);
                    }
                });

                if (type.toUpperCase() === 'BUTTONLABEL') {
                    return label;
                }
                return $sce.trustAsHtml(label);
            };

            // UI operations to show/hide checkboxes based on click event..
            $scope.toggleCheckboxes = function(e) {

                // We grab the button
                var clickedEl = element.children()[0];

                // Just to make sure.. had a bug where key events were recorded twice
                angular.element(document).off('click', $scope.externalClickListener);
                angular.element(document).off('keydown', $scope.keyboardListener);

                // The idea below was taken from another multi-select directive - https://github.com/amitava82/angular-multiselect 
                // His version is awesome if you need a more simple multi-select approach.                                

                // close
                if (angular.element(checkBoxLayer).hasClass('show')) {

                    angular.element(checkBoxLayer).removeClass('show');
                    angular.element(clickedEl).removeClass('buttonClicked');
                    angular.element(document).off('click', $scope.externalClickListener);
                    angular.element(document).off('keydown', $scope.keyboardListener);

                    // clear the focused element;
                    $scope.removeFocusStyle($scope.tabIndex);
                    if (typeof formElements[$scope.tabIndex] !== 'undefined') {
                        formElements[$scope.tabIndex].blur();
                    }

                    // close callback
                    $timeout(function() {
                        $scope.onClose();
                    }, 0);

                    // set focus on button again
                    element.children().children()[0].focus();
                }
                // open
                else {
                    // clear filter
                    $scope.inputLabel.labelFilter = '';
                    $scope.updateFilter();

                    helperItems = [];
                    helperItemsLength = 0;

                    angular.element(checkBoxLayer).addClass('show');
                    angular.element(clickedEl).addClass('buttonClicked');

                    // Attach change event listener on the input filter. 
                    // We need this because ng-change is apparently not an event listener.                    
                    angular.element(document).on('click', $scope.externalClickListener);
                    angular.element(document).on('keydown', $scope.keyboardListener);

                    // to get the initial tab index, depending on how many helper elements we have. 
                    // priority is to always focus it on the input filter                                                                
                    $scope.getFormElements();
                    $scope.tabIndex = 0;

                    var helperContainer = angular.element(element[0].querySelector('.helperContainer'))[0];

                    if (typeof helperContainer !== 'undefined') {
                        for (var i = 0; i < helperContainer.getElementsByTagName('BUTTON').length; i++) {
                            helperItems[i] = helperContainer.getElementsByTagName('BUTTON')[i];
                        }
                        helperItemsLength = helperItems.length + helperContainer.getElementsByTagName('INPUT').length;
                    }

                    // focus on the filter element on open. 
                    if (element[0].querySelector('.inputFilter')) {
                        element[0].querySelector('.inputFilter').focus();
                        $scope.tabIndex = $scope.tabIndex + helperItemsLength - 2;
                        // blur button in vain
                        angular.element(element).children()[0].blur();
                    }
                    // if there's no filter then just focus on the first checkbox item
                    else {
                        if (!$scope.isDisabled) {
                            $scope.tabIndex = $scope.tabIndex + helperItemsLength;
                            if ($scope.inputModel.length > 0) {
                                formElements[$scope.tabIndex].focus();
                                $scope.setFocusStyle($scope.tabIndex);
                                // blur button in vain
                                angular.element(element).children()[0].blur();
                            }
                        }
                    }

                    // open callback
                    $scope.onOpen();
                }
            };

            // handle clicks outside the button / multi select layer
            $scope.externalClickListener = function(e) {

                var targetsArr = element.find(e.target.tagName);
                for (var i = 0; i < targetsArr.length; i++) {
                    if (e.target == targetsArr[i]) {
                        return;
                    }
                }

                angular.element(checkBoxLayer.previousSibling).removeClass('buttonClicked');
                angular.element(checkBoxLayer).removeClass('show');
                angular.element(document).off('click', $scope.externalClickListener);
                angular.element(document).off('keydown', $scope.keyboardListener);

                // close callback                
                $timeout(function() {
                    $scope.onClose();
                }, 0);

                // set focus on button again
                element.children().children()[0].focus();
            };

            // select All / select None / reset buttons
            $scope.select = function(type, e) {

                var helperIndex = helperItems.indexOf(e.target);
                $scope.tabIndex = helperIndex;

                switch (type.toUpperCase()) {
                    case 'ALL':
                        angular.forEach($scope.filteredModel, function(value, key) {
                            if (typeof value !== 'undefined' && value[attrs.disableProperty] !== true) {
                                if (typeof value[attrs.groupProperty] === 'undefined') {
                                    value[$scope.tickProperty] = true;
                                }
                            }
                        });
                        angular.forEach($scope.filterInputModel, function(value, key) {
                            if (typeof value !== 'undefined' && value[attrs.disableProperty] !== true) {
                                if (typeof value[attrs.groupProperty] === 'undefined') {
                                    value[$scope.tickProperty] = true;
                                }
                            }
                        });
                        $scope.refreshOutputModel();
                        $scope.refreshButton();
                        $scope.onSelectAll();
                        break;
                    case 'NONE':
                        angular.forEach($scope.filteredModel, function(value, key) {
                            if (typeof value !== 'undefined' && value[attrs.disableProperty] !== true) {
                                if (typeof value[attrs.groupProperty] === 'undefined') {
                                    value[$scope.tickProperty] = false;
                                }
                            }
                        });
                        $scope.refreshOutputModel();
                        $scope.refreshButton();
                        $scope.onSelectNone();
                        break;
                    case 'RESET':
                        angular.forEach($scope.filteredModel, function(value, key) {
                            if (typeof value[attrs.groupProperty] === 'undefined' && typeof value !== 'undefined' && value[attrs.disableProperty] !== true) {
                                var temp = value[$scope.indexProperty];
                                value[$scope.tickProperty] = false;
                            }
                        });
                        $scope.refreshOutputModel();
                        $scope.refreshButton();
                        $scope.onReset();
                        break;
                    case 'CLEAR':
                        $scope.tabIndex = $scope.tabIndex + 1;
                        $scope.onClear();
                        break;
                    case 'FILTER':
                        $scope.tabIndex = helperItems.length - 1;
                        break;
                    default:
                }
            };

            // just to create a random variable name                
            function genRandomString(length) {
                var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
                var temp = '';
                for (var i = 0; i < length; i++) {
                    temp += possible.charAt(Math.floor(Math.random() * possible.length));
                }
                return temp;
            }

            // count leading spaces
            $scope.prepareGrouping = function() {
                var spacing = 0;
                angular.forEach($scope.filteredModel, function(value, key) {
                    value[$scope.spacingProperty] = spacing;
                    if (value[attrs.groupProperty] === true) {
                        spacing += 2;
                    } else if (value[attrs.groupProperty] === false) {
                        spacing -= 2;
                    }
                });
            };

            // prepare original index
            $scope.prepareIndex = function() {
                var ctr = 0;
                angular.forEach($scope.filteredModel, function(value, key) {
                    value[$scope.indexProperty] = ctr;
                    ctr++;
                });
            };

            // navigate using up and down arrow
            $scope.keyboardListener = function(e) {

                var key = e.keyCode ? e.keyCode : e.which;
                var isNavigationKey = false;

                // ESC key (close)
                if (key === 27) {
                    e.preventDefault();
                    e.stopPropagation();
                    $scope.toggleCheckboxes(e);
                }


                // next element ( tab, down & right key )                    
                else if (key === 40 || key === 39 || (!e.shiftKey && key == 9)) {

                    isNavigationKey = true;
                    prevTabIndex = $scope.tabIndex;
                    $scope.tabIndex++;
                    if ($scope.tabIndex > formElements.length - 1) {
                        $scope.tabIndex = 0;
                        prevTabIndex = formElements.length - 1;
                    }
                    while (formElements[$scope.tabIndex].disabled === true) {
                        $scope.tabIndex++;
                        if ($scope.tabIndex > formElements.length - 1) {
                            $scope.tabIndex = 0;
                        }
                        if ($scope.tabIndex === prevTabIndex) {
                            break;
                        }
                    }
                }

                // prev element ( shift+tab, up & left key )
                else if (key === 38 || key === 37 || (e.shiftKey && key == 9)) {
                    isNavigationKey = true;
                    prevTabIndex = $scope.tabIndex;
                    $scope.tabIndex--;
                    if ($scope.tabIndex < 0) {
                        $scope.tabIndex = formElements.length - 1;
                        prevTabIndex = 0;
                    }
                    while (formElements[$scope.tabIndex].disabled === true) {
                        $scope.tabIndex--;
                        if ($scope.tabIndex === prevTabIndex) {
                            break;
                        }
                        if ($scope.tabIndex < 0) {
                            $scope.tabIndex = formElements.length - 1;
                        }
                    }
                }

                if (isNavigationKey === true) {

                    e.preventDefault();

                    // set focus on the checkbox                    
                    formElements[$scope.tabIndex].focus();
                    var actEl = document.activeElement;

                    if (actEl.type.toUpperCase() === 'CHECKBOX') {
                        $scope.setFocusStyle($scope.tabIndex);
                        $scope.removeFocusStyle(prevTabIndex);
                    } else {
                        $scope.removeFocusStyle(prevTabIndex);
                        $scope.removeFocusStyle(helperItemsLength);
                        $scope.removeFocusStyle(formElements.length - 1);
                    }
                }

                isNavigationKey = false;
            };

            // set (add) CSS style on selected row
            $scope.setFocusStyle = function(tabIndex) {
                angular.element(formElements[tabIndex]).parent().parent().parent().addClass('multiSelectFocus');
            };

            // remove CSS style on selected row
            $scope.removeFocusStyle = function(tabIndex) {
                angular.element(formElements[tabIndex]).parent().parent().parent().removeClass('multiSelectFocus');
            };

            /*********************
             *********************             
             *
             * 1) Initializations
             *
             *********************
             *********************/

            // attrs to $scope - attrs-$scope - attrs - $scope
            // Copy some properties that will be used on the template. They need to be in the $scope.
            $scope.groupProperty = attrs.groupProperty;
            $scope.tickProperty = attrs.tickProperty;
            $scope.directiveId = attrs.directiveId;

            // Unfortunately I need to add these grouping properties into the input model
            var tempStr = genRandomString(5);
            $scope.indexProperty = 'idx_' + tempStr;
            $scope.spacingProperty = 'spc_' + tempStr;

            // set orientation css            
            if (typeof attrs.orientation !== 'undefined') {

                if (attrs.orientation.toUpperCase() === 'HORIZONTAL') {
                    $scope.orientationH = true;
                    $scope.orientationV = false;
                } else {
                    $scope.orientationH = false;
                    $scope.orientationV = true;
                }
            }

            // get elements required for DOM operation
            checkBoxLayer = element.children().children().next()[0];

            // set max-height property if provided
            if (typeof attrs.maxHeight !== 'undefined') {
                var layer = element.children().children().children()[0];
                angular.element(layer).attr("style", "height:" + attrs.maxHeight + "; overflow-y:scroll;");
            }

            // some flags for easier checking            
            for (var property in $scope.helperStatus) {
                if ($scope.helperStatus.hasOwnProperty(property)) {
                    if (
                        typeof attrs.helperElements !== 'undefined' && attrs.helperElements.toUpperCase().indexOf(property.toUpperCase()) === -1
                    ) {
                        $scope.helperStatus[property] = false;
                    }
                }
            }
            if (typeof attrs.selectionMode !== 'undefined' && attrs.selectionMode.toUpperCase() === 'SINGLE') {
                $scope.helperStatus['all'] = false;
                $scope.helperStatus['none'] = false;
            }

            // helper button icons.. I guess you can use html tag here if you want to. 
            $scope.icon = {};
            $scope.icon.selectAll = '&#10003;'; // a tick icon
            $scope.icon.selectNone = '&times;'; // x icon
            $scope.icon.reset = '&#8630;'; // undo icon            
            // this one is for the selected items
            $scope.icon.tickMark = '&#10003;'; // a tick icon 

            // configurable button labels                       
            if (typeof attrs.translation !== 'undefined') {
                $scope.lang.selectAll = $sce.trustAsHtml($scope.icon.selectAll + '&nbsp;&nbsp;' + $scope.translation.selectAll);
                $scope.lang.selectNone = $sce.trustAsHtml($scope.icon.selectNone + '&nbsp;&nbsp;' + $scope.translation.selectNone);
                $scope.lang.reset = $sce.trustAsHtml($scope.icon.reset + '&nbsp;&nbsp;' + $scope.translation.reset);
                $scope.lang.search = $scope.translation.search;
                $scope.lang.nothingSelected = $sce.trustAsHtml($scope.translation.nothingSelected);
            } else {
                $scope.lang.selectAll = $sce.trustAsHtml($scope.icon.selectAll + '&nbsp;&nbsp;Select All');
                $scope.lang.selectNone = $sce.trustAsHtml($scope.icon.selectNone + '&nbsp;&nbsp;Select None');
                $scope.lang.reset = $sce.trustAsHtml($scope.icon.reset + '&nbsp;&nbsp;Reset');
                $scope.lang.search = 'Search...';
                $scope.lang.nothingSelected = '';
            }
            $scope.icon.tickMark = $sce.trustAsHtml($scope.icon.tickMark);

            // min length of keyword to trigger the filter function
            if (typeof attrs.MinSearchLength !== 'undefined' && parseInt(attrs.MinSearchLength) > 0) {
                vMinSearchLength = Math.floor(parseInt(attrs.MinSearchLength));
            }

            /*******************************************************
             *******************************************************
             *
             * 2) Logic starts here, initiated by watch 1 & watch 2
             *
             *******************************************************
             *******************************************************/

            // watch1, for changes in input model property
            // updates multi-select when user select/deselect a single checkbox programatically
            // https://github.com/isteven/angular-multi-select/issues/8            
            /*$scope.$watch('inputModel', function(newVal) {
                if (newVal) {
                    $scope.refreshOutputModel();
                    $scope.refreshButton();
                }
            }, true);*/

            // watch2 for changes in input model as a whole
            // this on updates the multi-select when a user load a whole new input-model. We also update the $scope.backUp variable
            $scope.$watch('inputModel', function(oldVal, newVal) {
                if (newVal !== oldVal) {
                    $scope.backUp = angular.copy($scope.inputModel);
                    $scope.updateFilter();
                    $scope.prepareGrouping();
                    $scope.prepareIndex();
                    // $scope.refreshOutputModel();
                    // $scope.refreshButton();
                }
            });

            // watch for changes in directive state (disabled or enabled)
            $scope.$watch('isDisabled', function(newVal) {
                $scope.isDisabled = newVal;
            });

            // add by xjma
            $scope.$watch("selectedData", function(oldVal, newVal) {
                if (newVal !== oldVal) {
                    $scope.backUp = angular.copy($scope.inputModel);
                    $scope.updateFilter();
                    $scope.prepareGrouping();
                    $scope.prepareIndex();
                    $scope.refreshOutputModel();
                    $scope.refreshButton();
                    $scope.init();
                }
            });

            // this is for touch enabled devices. We don't want to hide checkboxes on scroll. 
            var onTouchStart = function(e) {
                $scope.$apply(function() {
                    $scope.scrolled = false;
                });
            };
            angular.element(document).bind('touchstart', onTouchStart);
            var onTouchMove = function(e) {
                $scope.$apply(function() {
                    $scope.scrolled = true;
                });
            };
            angular.element(document).bind('touchmove', onTouchMove);

            // unbind document events to prevent memory leaks
            $scope.$on('$destroy', function() {
                angular.element(document).unbind('touchstart', onTouchStart);
                angular.element(document).unbind('touchmove', onTouchMove);
            });
        }
    };
}]).run(['$templateCache', function($templateCache) {
    var template =
        '<span class="multiSelect inlineBlock">' +
        // main button, modified by sun
        '<button class="form-control pull-left" id="{{directiveId}}" type="button"' +
        'ng-click="toggleCheckboxes( $event ); refreshSelectedItems(); refreshButton(); prepareGrouping; prepareIndex(); filter();"' +
        'ng-bind-html="varButtonLabel"' +
        'ng-disabled="disable-button"' +
        '>' +
        '</button>' +
        // overlay layer
        '<div class="checkboxLayer">' +
        // container of the helper elements
        '<div class="helperContainer" ng-if="helperStatus.filter || helperStatus.all || helperStatus.none || helperStatus.reset ">' +
        // container of the first 3 buttons, select all, none and reset
        '<div class="line" ng-if="helperStatus.all || helperStatus.none || helperStatus.reset ">' +
        // select all
        '<button name="selectAll" type="button" class="helperButton"' +
        'ng-disabled="isDisabled"' +
        'ng-if="helperStatus.all"' +
        'ng-click="select( \'all\', $event );"' +
        'ng-bind-html="lang.selectAll">' +
        '</button>' +
        // select none
        '<button name="selectNone" type="button" class="helperButton"' +
        'ng-disabled="isDisabled"' +
        'ng-if="helperStatus.none"' +
        'ng-click="select( \'none\', $event );"' +
        'ng-bind-html="lang.selectNone">' +
        '</button>' +
        // reset
        '<button name="reset" type="button" class="helperButton reset"' +
        'ng-disabled="isDisabled"' +
        'ng-if="helperStatus.reset"' +
        'ng-click="select( \'reset\', $event );"' +
        'ng-bind-html="lang.reset">' +
        '</button>' +
        '</div>' +
        // the search box
        '<div class="line" style="position:relative" ng-if="helperStatus.filter">' +
        // textfield  
        //modified by sun              
        '<input name="inputFilter" placeholder="{{lang.search}}" type="text"' +
        'ng-click="select( \'filter\', $event )" ' +
        'ng-model="inputLabel.labelFilter" ' +
        'ng-change="searchChanged()" class="inputFilter" ng-model-options="{debounce: 2000}"' +
        '/>' +
        // clear button
        '<button type="button" class="clearButton" ng-click="clearClicked($event)" >×</button> ' +
        // '<button type="button" class="searchButton" ng-click="searchChanged()" >search</button> ' +
        '</div> ' +
        '<div class="line" style="position:relative">' +
        '<span ng-repeat="item in outputModel">' +
        '<button data-toggle="tooltip" data-placement="bottom" title="移除" ng-click="removeSelected(item.id, $event)" class="helperButton" ng-bind="\'x \'+item.name"></button>' +
        '</span>' +
        '</div>' +
        '</div> ' +
        // selection items
        '<div id="{{selectorId}}" class="checkBoxContainer" scroll-bottom="loadMore()" selector-id="selectorId">' +
        '<div name="{{item.name}}" ' +
        'ng-repeat="item in filteredModel | filter:removeGroupEndMarker" class="multiSelectItem"' +
        'ng-class="{selected: item[ tickProperty ], horizontal: orientationH, vertical: orientationV, multiSelectGroup:item[ groupProperty ], disabled:itemIsDisabled( item )}"' +
        'ng-click="syncItems( item, $event, $index );" ' +
        'ng-mouseleave="removeFocusStyle( tabIndex );"> ' +
        // this is the spacing for grouped items
        '<div class="acol" ng-if="item[ spacingProperty ] > 0" ng-repeat="i in numberToArray( item[ spacingProperty ] ) track by $index">' +
        '</div>  ' +
        '<div class="acol">' +
        '<label>' +
        // input, so that it can accept focus on keyboard click
        '<input class="checkbox focusable" type="checkbox" ' +
        'ng-disabled="itemIsDisabled( item )" ' +
        'ng-checked="item[ tickProperty ]" ' +
        'ng-click="syncItems( item, $event, $index )" value="{{item.id}}" />' +
        // item label using ng-bind-hteml
        '<span ' +
        'ng-class="{disabled:itemIsDisabled( item )}" ' +
        'ng-bind-html="writeLabel( item, \'itemLabel\' )">' +
        '</span>' +
        '</label>' +
        '</div>' +
        // the tick/check mark
        '<span class="tickMark" ng-if="item[ groupProperty ] !== true && item[ tickProperty ] === true" ng-bind-html="icon.tickMark"></span>' +
        '</div>' +
        '<div class="multiSelectItem" ng-if="filteredModel.length >= 20 && hasMore">Load More……</div>' +
        '</div>' +
        '</div>' +
        '</span>';
    $templateCache.put('isteven-multi-select.htm', template);
}]).directive('scrollBottom', function($timeout) {
    return {
        scope: {
            scrollBottom: '&',
            selectorId: '='
        },
        restrict: 'A',
        link: function(scope, element, attr) {
            $timeout(function() {
                // var elem = angular.element(checkBoxContainer);
                var elem = angular.element(document.getElementById(scope.selectorId));
                elem.bind('scroll', function() {
                    elem = elem[0] || elem;
                    if (elem.offsetHeight + elem.scrollTop === elem.scrollHeight) {
                        $timeout(function() {
                            scope.scrollBottom();
                            scope.$apply();
                        }, 500);
                    }
                });
                element.on('$destroy', function() {
                    element.unbind('scroll');
                });
            }, 500);
        }
    };
});
