describe('test', function() {
    var $scope, $_compile, $httpBackend, el, template, test;
    let getTest = function($injector, $compile, $rootScope) {
        $_compile = $compile;
        $scope = $rootScope.$new();
        $httpBackend = $injector.get('$httpBackend');
    };

    beforeEach(function() {
        module('isteven-multi-select');
        inject(getTest);

    });

    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });
    //测试多选模式下组件的元素
    /*1.当页面上输入控件的指令时，验证会出现的页面元素
      2.当页面上输入控件的指令时，验证指令里面的model的值（未完成）
    */
    it('it should add this element', function() {
        el = angular.element('<div isteven-multi-select  output-model="selectedTests" selector-id="selectedTest">');
        template = $_compile(el)($scope);
        $scope.$digest();
        //指令生效时div的属性变化
        expect(template.attr('class')).to.equal('ng-scope ng-isolate-scope');
        expect(template.find('span').length).to.equal(2);
        expect(template.find('span').find('span').attr('class')).to.equal('caret');
        expect(template.find('span').attr('class')).to.equal('multiSelect inlineBlock');

        //指令生效时页面上的button数量以及展开按钮的属性
        expect(template.find('button').length).to.equal(6);
        expect(template.find('button').attr('class')).to.equal('form-control pull-left ng-binding');
        expect(template.find('button').attr('id')).to.equal('');
        expect(template.find('button').attr('type')).to.equal('button');
        expect(template.find('button').attr('ng-bind-html')).to.equal('varButtonLabel');
        expect(template.find('button').attr('ng-click')).to.equal('toggleCheckboxes( $event ); refreshSelectedItems(); refreshButton(); prepareGrouping; prepareIndex(); init();');
        expect(template.find('button').attr('ng-disabled')).to.equal('disable-button');

        //指令生效时页面的全选按钮的属性
        expect(template.find('div').children('div').find('div').children('button').attr('name')).to.equal('selectAll');
        expect(template.find('div').children('div').find('div').children('button').attr('type')).to.equal('button');
        expect(template.find('div').children('div').find('div').children('button').attr('class')).to.equal('helperButton ng-binding ng-scope');
        expect(template.find('div').children('div').find('div').children('button').attr('ng-disabled')).to.equal('isDisabled');
        expect(template.find('div').children('div').find('div').children('button').attr('ng-if')).to.equal('helperStatus.all');
        expect(template.find('div').children('div').find('div').children('button').attr('ng-click')).to.equal("select( \'all\', $event );");
        expect(template.find('div').children('div').find('div').children('button').attr('ng-bind-html')).to.equal('lang.selectAll');
        //expect(template.find('div').children('div').find('div').children('button').attr('val')).to.equal('✓  Select All');

        //指令生效时页面上的全不选按钮的属性
        expect(template.find('div').children('div').find('div').children('button').next().attr('name')).to.equal('selectNone');
        expect(template.find('div').children('div').find('div').children('button').next().attr('type')).to.equal('button');
        expect(template.find('div').children('div').find('div').children('button').next().attr('class')).to.equal('helperButton ng-binding ng-scope');
        expect(template.find('div').children('div').find('div').children('button').next().attr('ng-disabled')).to.equal('isDisabled');
        expect(template.find('div').children('div').find('div').children('button').next().attr('ng-if')).to.equal('helperStatus.none');
        expect(template.find('div').children('div').find('div').children('button').next().attr('ng-click')).to.equal("select( \'none\', $event );");
        expect(template.find('div').children('div').find('div').children('button').next().attr('ng-bind-html')).to.equal('lang.selectNone');

        //指令生效时页面上的重置按钮的属性
        expect(template.find('div').children('div').find('div').children('button').next().next().attr('name')).to.equal('reset');
        expect(template.find('div').children('div').find('div').children('button').next().next().attr('type')).to.equal('button');
        expect(template.find('div').children('div').find('div').children('button').next().next().attr('class')).to.equal('helperButton reset ng-binding ng-scope');
        expect(template.find('div').children('div').find('div').children('button').next().next().attr('ng-disabled')).to.equal('isDisabled');
        expect(template.find('div').children('div').find('div').children('button').next().next().attr('ng-if')).to.equal('helperStatus.reset');
        expect(template.find('div').children('div').find('div').children('button').next().next().attr('ng-click')).to.equal("select( \'reset\', $event );");
        expect(template.find('div').children('div').find('div').children('button').next().next().attr('ng-bind-html')).to.equal('lang.reset');

        //指令生效时页面上的清除按钮的属性
        expect(template.find('div').children('div').find('div').next().find('button').attr('class')).to.equal('clearButton');
        expect(template.find('div').children('div').find('div').next().find('button').attr('type')).to.equal('button');
        expect(template.find('div').children('div').find('div').next().find('button').attr('ng-click')).to.equal('clearClicked($event)');

        //指令生效时页面上的div数量以及checkboxLayer的属性
        expect(template.find('div').length).to.equal(6);
        expect(template.find('div').attr('class')).to.equal('checkboxLayer');

        //指令生效时页面上的helperContainer属性
        expect(template.find('div').children('div').attr('class')).to.equal('helperContainer ng-scope');
        expect(template.find('div').children('div').attr('ng-if')).to.equal('helperStatus.filter || helperStatus.all || helperStatus.none || helperStatus.reset ');

        //指令生效时页面上的checkBoxContainer属性
        expect(template.find('div').children('div').next().attr('class')).to.equal('checkBoxContainer ng-isolate-scope');
        expect(template.find('div').children('div').next().attr('id')).to.equal('selectedTest');
        expect(template.find('div').children('div').next().attr('scroll-bottom')).to.equal('loadMore()');

        expect(template.find('div').children('div').find('div').attr('class')).to.equal('line ng-scope');
        expect(template.find('div').children('div').find('div').attr('ng-if')).to.equal('helperStatus.all || helperStatus.none || helperStatus.reset ');

        expect(template.find('div').children('div').find('div').next().attr('class')).to.equal('line ng-scope');
        expect(template.find('div').children('div').find('div').next().attr('style')).to.equal('position:relative');
        expect(template.find('div').children('div').find('div').next().attr('ng-if')).to.equal('helperStatus.filter');

        expect(template.find('div').children('div').find('div').next().next().attr('class')).to.equal('line');
        expect(template.find('div').children('div').find('div').next().next().attr('style')).to.equal('position:relative');

        //指令生效时页面上的inputFilter属性
        expect(template.find('input').length).to.equal(1);
        expect(template.find('input').attr('name')).to.equal('inputFilter');
        expect(template.find('input').attr('placeholder')).to.equal('Search...');
        expect(template.find('input').attr('type')).to.equal('text');
        expect(template.find('input').attr('ng-click')).to.equal("select( \'filter\', $event )");
        expect(template.find('input').attr('ng-model')).to.equal('inputLabel.labelFilter');
        expect(template.find('input').attr('ng-change')).to.equal('');
        expect(template.find('input').attr('class')).to.equal('inputFilter ng-pristine ng-untouched ng-valid ng-empty');
    });
    //测试多选模式下组件的元素
    /*1.当页面上输入控件的指令时，验证会出现的页面元素
      2.当页面上输入控件的指令时，验证指令里面的model的值（未完成）
    */
    it('it should add this element111', function() {
        el = angular.element('<div isteven-multi-select selection-mode="single" output-model="selectedTests">');
        template = $_compile(el)($scope);
        $scope.$digest();
        //指令生效时div的属性变化
        expect(template.attr('class')).to.equal('ng-scope ng-isolate-scope');
        expect(template.find('span').length).to.equal(2);
        expect(template.find('span').find('span').attr('class')).to.equal('caret');
        expect(template.find('span').attr('class')).to.equal('multiSelect inlineBlock');

        //指令生效时页面上的button数量以及展开按钮的属性
        expect(template.find('button').length).to.equal(4);
        expect(template.find('button').attr('class')).to.equal('form-control pull-left ng-binding');
        expect(template.find('button').attr('id')).to.equal('');
        expect(template.find('button').attr('type')).to.equal('button');
        expect(template.find('button').attr('ng-bind-html')).to.equal('varButtonLabel');
        expect(template.find('button').attr('ng-click')).to.equal('toggleCheckboxes( $event ); refreshSelectedItems(); refreshButton(); prepareGrouping; prepareIndex(); init();');
        expect(template.find('button').attr('ng-disabled')).to.equal('disable-button');

       //指令生效时页面上的重置按钮的属性
        expect(template.find('div').children('div').find('div').children('button').attr('name')).to.equal('reset');
        expect(template.find('div').children('div').find('div').children('button').attr('type')).to.equal('button');
        expect(template.find('div').children('div').find('div').children('button').attr('class')).to.equal('helperButton reset ng-binding ng-scope');
        expect(template.find('div').children('div').find('div').children('button').attr('ng-disabled')).to.equal('isDisabled');
        expect(template.find('div').children('div').find('div').children('button').attr('ng-if')).to.equal('helperStatus.reset');
        expect(template.find('div').children('div').find('div').children('button').attr('ng-click')).to.equal("select( \'reset\', $event );");
        expect(template.find('div').children('div').find('div').children('button').attr('ng-bind-html')).to.equal('lang.reset');

        //指令生效时页面上的清除按钮的属性
        expect(template.find('div').children('div').find('div').next().find('button').attr('class')).to.equal('clearButton');
        expect(template.find('div').children('div').find('div').next().find('button').attr('type')).to.equal('button');
        expect(template.find('div').children('div').find('div').next().find('button').attr('ng-click')).to.equal('clearClicked($event)');

        //指令生效时页面上的div数量以及checkboxLayer的属性
        expect(template.find('div').length).to.equal(6);
        expect(template.find('div').attr('class')).to.equal('checkboxLayer');

       //指令生效时页面上的checkBoxContainer属性 
        expect(template.find('div').children('div').attr('class')).to.equal('helperContainer ng-scope');
        expect(template.find('div').children('div').attr('ng-if')).to.equal('helperStatus.filter || helperStatus.all || helperStatus.none || helperStatus.reset ');

        expect(template.find('div').children('div').next().attr('class')).to.equal('checkBoxContainer ng-isolate-scope');
        //expect(template.find('div').children('div').next().attr('id')).to.equal('checkBoxContainer');
        expect(template.find('div').children('div').next().attr('scroll-bottom')).to.equal('loadMore()');

        expect(template.find('div').children('div').find('div').attr('class')).to.equal('line ng-scope');
        expect(template.find('div').children('div').find('div').attr('ng-if')).to.equal('helperStatus.all || helperStatus.none || helperStatus.reset ');

        expect(template.find('div').children('div').find('div').next().attr('class')).to.equal('line ng-scope');
        expect(template.find('div').children('div').find('div').next().attr('style')).to.equal('position:relative');
        expect(template.find('div').children('div').find('div').next().attr('ng-if')).to.equal('helperStatus.filter');

        expect(template.find('div').children('div').find('div').next().next().attr('class')).to.equal('line');
        expect(template.find('div').children('div').find('div').next().next().attr('style')).to.equal('position:relative');

        //指令生效时页面上的inputFilter属性
        expect(template.find('input').length).to.equal(1);
        expect(template.find('input').attr('name')).to.equal('inputFilter');
        expect(template.find('input').attr('placeholder')).to.equal('Search...');
        expect(template.find('input').attr('type')).to.equal('text');
        expect(template.find('input').attr('ng-click')).to.equal("select( \'filter\', $event )");
        expect(template.find('input').attr('ng-model')).to.equal('inputLabel.labelFilter');
        expect(template.find('input').attr('ng-change')).to.equal('');
        expect(template.find('input').attr('class')).to.equal('inputFilter ng-pristine ng-untouched ng-valid ng-empty');
    });
    //测试单选模式下组件里面的点击展开元素以及查询功能
    /*1.当页面上输入控件的指令时，验证会出现的页面元素
      2.当页面上输入控件的指令时，验证指令里面的model的值（未完成）
      3.当页面上输入控件的指令时，验证查询之后返回的结果（未完成）
    */
    it('test first button for single selection', function() {
        $httpBackend.when('POST', '/test/').respond({
            status: 'success',
            message: false,
            data: {
                filterRecord: [
                    { id: '1', name: '1', ticked: false },
                    { id: '2', name: '2', ticked: false },
                    { id: '3', name: '3', ticked: false }
                ]
            }
        });

        el = angular.element('<div isteven-multi-select selection-mode="single" filter-url="/test/" output-model="selectedTests" button-label="name" item-label="name" tick-property="ticked" selected-data="testData"></div>');
        template = $_compile(el)($scope);
        $scope.$digest();

        let initButton = angular.element(el.find('button')[0]);
        initButton.triggerHandler('click');
        $httpBackend.flush();

        //点击事件生效时页面上的div数量
        let checkBoxContainerFirstDiv = template.find('div').children('div').next().children('div');
        expect(template.find('div').children('div').next().children('div').length).to.equal(8);

        //点击事件生效时页面上每个返回结果的div的属性
        for (var i = 0; i < 3; i++) {
            expect(checkBoxContainerFirstDiv.attr('name')).to.equal('' + (i + 1));
            expect(checkBoxContainerFirstDiv.attr('ng-repeat')).to.equal('item in filteredModel | filter:removeGroupEndMarker');
            expect(checkBoxContainerFirstDiv.attr('class')).to.equal('multiSelectItem ng-scope vertical');
            expect(checkBoxContainerFirstDiv.attr('ng-class')).to.equal('{selected: item[ tickProperty ], horizontal: orientationH, vertical: orientationV, multiSelectGroup:item[ groupProperty ], disabled:itemIsDisabled( item )}');
            expect(checkBoxContainerFirstDiv.attr('ng-click')).to.equal('syncItems( item, $event, $index );');
            expect(checkBoxContainerFirstDiv.attr('ng-mouseleave')).to.equal('removeFocusStyle( tabIndex );');
            expect(checkBoxContainerFirstDiv.children('div').attr('class')).to.equal('acol');
            //expect(checkBoxContainerFirstDiv.children('div').children('label').length).to.equal(1);
            expect(checkBoxContainerFirstDiv.children('div').find('input').attr('class')).to.equal('checkbox focusable');
            expect(checkBoxContainerFirstDiv.children('div').find('input').attr('type')).to.equal('checkbox');
            expect(checkBoxContainerFirstDiv.children('div').find('input').attr('ng-disabled')).to.equal('itemIsDisabled( item )');
            expect(checkBoxContainerFirstDiv.children('div').find('input').attr('ng-checked')).to.equal('item[ tickProperty ]');
            expect(checkBoxContainerFirstDiv.children('div').find('input').attr('ng-click')).to.equal('syncItems( item, $event, $index )');
            expect(checkBoxContainerFirstDiv.children('div').find('input').attr('value')).to.equal('' + (i + 1));
            expect(checkBoxContainerFirstDiv.children('div').find('span').attr('ng-class')).to.equal('{disabled:itemIsDisabled( item )}');
            expect(checkBoxContainerFirstDiv.children('div').find('span').attr('ng-bind-html')).to.equal("writeLabel( item, 'itemLabel' )");
            expect(checkBoxContainerFirstDiv.children('div').find('span').attr('class')).to.equal('ng-binding');
            //expect(checkBoxContainerFirstDiv.children('div').find('span').getText()).to.equal(''+(i+1));
            checkBoxContainerFirstDiv = checkBoxContainerFirstDiv.next();
        }
    });
    // 测试多选模式下查询之后全选按钮
    /*1.当页面上输入控件的指令时，验证会出现的页面元素
      2.当页面上输入控件的指令时，验证指令里面的model的值（未完成）
      3.当页面上输入控件的指令时，验证查询之后返回的结果（未完成）
    */
    it('test selectAll button', function() {
        $httpBackend.when('POST', '/test/').respond({
            status: 'success',
            message: false,
            data: {
                filterRecord: [
                    { id: '1', name: '1', ticked: false },
                    { id: '2', name: '2', ticked: false },
                    { id: '3', name: '3', ticked: false }
                ]
            }
        });

        el = angular.element('<div isteven-multi-select filter-url="/test/" output-model="selectedTests" button-label="name" item-label="name" tick-property="ticked" selected-data="testData"></div>');
        template = $_compile(el)($scope);
        $scope.$digest();

        let initButton = angular.element(el.find('button')[0]);
        let selectAllButton = angular.element(el.find('div').children('div').children('div').children('button')[0]);

        initButton.triggerHandler('click');
        $httpBackend.flush();

        selectAllButton.triggerHandler('click');

        let firstTestSpan = template.find('div').children('div').children('div').next().next().children('span');
        //点击事件生效时页面上每个应该被选中的div的属性变化
        for (var i = 0; i < 3; i++) {
            expect(firstTestSpan.attr('ng-repeat')).to.equal('item in outputModel');
            expect(firstTestSpan.attr('class')).to.equal('ng-scope');
            expect(firstTestSpan.find('button').attr('data-toggle')).to.equal('tooltip');
            expect(firstTestSpan.find('button').attr('data-placement')).to.equal('bottom');
            expect(firstTestSpan.find('button').attr('title')).to.equal('移除');
            expect(firstTestSpan.find('button').attr('ng-click')).to.equal('removeSelected(item.id, $event)');
            expect(firstTestSpan.find('button').attr('class')).to.equal('helperButton ng-binding');
            expect(firstTestSpan.find('button').attr('ng-bind')).to.equal("\'x \'+item.name");
            firstTestSpan = firstTestSpan.next();
        }
    });
    //测试多选模式下的全不选按钮
    /*1.当页面上输入控件的指令时，验证会出现的页面元素
      2.当页面上输入控件的指令时，验证指令里面的model的值（未完成）
      3.当页面上输入控件的指令时，验证查询之后返回的结果（未完成）
    */
    it('test selectNone button', function() {
        $httpBackend.when('POST', '/test/').respond({
            status: 'success',
            message: false,
            data: {
                filterRecord: [
                    { id: '1', name: '1', ticked: false },
                    { id: '2', name: '2', ticked: false },
                    { id: '3', name: '3', ticked: false }
                ]
            }
        });

        el = angular.element('<div isteven-multi-select filter-url="/test/" output-model="selectedTests" button-label="name" item-label="name" tick-property="ticked" selected-data="testData"></div>');
        template = $_compile(el)($scope);
        $scope.$digest();

        let initButton = angular.element(el.find('button')[0]);
        let selectAllButton = angular.element(el.find('div').children('div').children('div').children('button')[0]);
        let selectNoneButton = angular.element(el.find('div').children('div').children('div').children('button')[1]);

        initButton.triggerHandler('click');
        $httpBackend.flush();

        selectAllButton.triggerHandler('click');
        selectNoneButton.triggerHandler('click');

        let firstTestSpan = template.find('div').children('div').children('div').next().next().children('span');

        //点击事件生效时页面上每个对应的结果的button数量
        expect(firstTestSpan.find('button').length).to.equal(0);
    });

    //测试多选模式下的查询输入框的功能
    /*1.当页面上输入控件的指令时，验证会出现的页面元素
      2.当页面上输入控件的指令时，验证指令里面的model的值（未完成）
      3.当页面上输入控件的指令时，验证查询之后返回的结果（未完成）
    */
    // currently we can not simulate the response result according to the search/filter condition, so we comment this 'it' for the time being, TODO, ...
    it('test inputFilter', function() {
        $httpBackend.whenPOST('/test/').respond(function(method, url, data) {
            var datas = {};
            data = JSON.parse(data);
            if (data.flag === 'init') {
                datas = {
                    status: 'success',
                    message: false,
                    data: {
                        filterRecord: [
                            { id: '1', name: '1', ticked: false },
                            { id: '2', name: '2', ticked: false },
                            { id: '3', name: '3', ticked: false },
                            { id: '1', name: '1111', ticked: false }
                        ]
                    }
                };
                return datas;
            } else if (data.flag === 'filter') {
                if (data.filterName !== null) {
                    datas = {
                        status: 'success',
                        message: false,
                        data: {
                            filterRecord: [
                                { id: '1', name: '1', ticked: false },
                                { id: '12', name: '1111', ticked: false }
                            ]
                        }
                    };
                    return datas;
                } else {
                    datas = {
                        status: 'success',
                        message: false,
                        data: {
                            filterRecord: [
                                { id: '1', name: '1', ticked: false },
                                { id: '2', name: '2', ticked: false },
                                { id: '3', name: '3', ticked: false },
                                { id: '1', name: '1111', ticked: false }
                            ]
                        }
                    };
                    return datas;
                }
            }
        });

        el = angular.element('<div isteven-multi-select filter-url="/test/" output-model="selectedTests" button-label="name" item-label="name" tick-property="ticked" selected-data="testData"></div>');
        template = $_compile(el)($scope);
        $scope.$digest();
        let initButton = angular.element(el.find('button')[0]);
        let inputFilter = angular.element(el.find('input'));

        initButton.triggerHandler('click');
        //expect(angular.element(template.find('div').children('div')[1]).children('input')).to.equal(1);

        inputFilter.attr('value', 1);
        inputFilter.triggerHandler('click');
        inputFilter.triggerHandler('change');
        $httpBackend.flush();
        expect(inputFilter.attr('value')).to.equal('1');

        let checkBoxContainerFirstDiv = template.find('div').children('div').next().children('div');
        let firstTestSpan = template.find('div').children('div').children('div').next().next().children('span');
        //点击事件生效时页面上每个返回结果的div的属性（未完成）
        expect(firstTestSpan.find('button').length).to.equal(0);
    });

    // currently we can not simulate the response result according to the search/filter condition, so we comment this 'it' for the time being, TODO, ...
    //未完成
    xit('test loadMore', function() {
        let filterRecord = [];
        let obj;
        let data = {};
        for (var i = 0; i < 40; i++) {
            obj = {};
            obj.id = 'id' + (i + 1);
            obj.name = 'name' + (i + 1);
            obj.ticked = 'false';
            filterRecord.push(obj);
        }
        data.filterRecord = filterRecord;
        $httpBackend.when('POST', '/test/').respond({
            status: 'success',
            message: false,
            data
        });

        el = angular.element('<div isteven-multi-select filter-url="/test/" output-model="selectedTests" button-label="name" item-label="name" tick-property="ticked" selected-data="testData"></div>');
        template = $_compile(el)($scope);
        $scope.$digest();

        let initButton = angular.element(el.find('button')[0]);

        initButton.triggerHandler('click');
        $httpBackend.flush();
        $httpBackend.expectPOST('/test/');

        let checkBoxContainerFirstDiv = template.find('div').children('div').next().children('div');
        //expect(template.find('div').children('div').next().children('div').length).to.equal(7);

        for (var j = 0; j < 40; j++) {
            expect(checkBoxContainerFirstDiv.attr('name')).to.equal('name' + (j + 1));
            expect(checkBoxContainerFirstDiv.attr('ng-repeat')).to.equal('item in filteredModel | filter:removeGroupEndMarker');
            expect(checkBoxContainerFirstDiv.attr('class')).to.equal('multiSelectItem ng-scope selected vertical');
            expect(checkBoxContainerFirstDiv.attr('ng-class')).to.equal('{selected: item[ tickProperty ], horizontal: orientationH, vertical: orientationV, multiSelectGroup:item[ groupProperty ], disabled:itemIsDisabled( item )}');
            expect(checkBoxContainerFirstDiv.attr('ng-click')).to.equal('syncItems( item, $event, $index );');
            expect(checkBoxContainerFirstDiv.attr('ng-mouseleave')).to.equal('removeFocusStyle( tabIndex );');
            expect(checkBoxContainerFirstDiv.children('div').attr('class')).to.equal('acol');
            //expect(checkBoxContainerFirstDiv.children('div').children('label').length).to.equal(1);
            expect(checkBoxContainerFirstDiv.children('div').find('input').attr('class')).to.equal('checkbox focusable');
            expect(checkBoxContainerFirstDiv.children('div').find('input').attr('type')).to.equal('checkbox');
            expect(checkBoxContainerFirstDiv.children('div').find('input').attr('ng-disabled')).to.equal('itemIsDisabled( item )');
            expect(checkBoxContainerFirstDiv.children('div').find('input').attr('ng-checked')).to.equal('item[ tickProperty ]');
            expect(checkBoxContainerFirstDiv.children('div').find('input').attr('ng-click')).to.equal('syncItems( item, $event, $index )');
            expect(checkBoxContainerFirstDiv.children('div').find('input').attr('value')).to.equal('id' + (j + 1));
            expect(checkBoxContainerFirstDiv.children('div').find('span').attr('ng-class')).to.equal('{disabled:itemIsDisabled( item )}');
            expect(checkBoxContainerFirstDiv.children('div').find('span').attr('ng-bind-html')).to.equal("writeLabel( item, 'itemLabel' )");
            expect(checkBoxContainerFirstDiv.children('div').find('span').attr('class')).to.equal('ng-binding');
            checkBoxContainerFirstDiv = checkBoxContainerFirstDiv.next();
        }
    });

    // 测试多选模式下的重置按钮
    /*1.当页面上输入控件的指令时，验证会出现的页面元素
      2.当页面上输入控件的指令时，验证指令里面的model的值（未完成）
      3.当页面上输入控件的指令时，验证查询之后返回的结果（未完成）
    */
    it('test reset button', function() {
        $httpBackend.when('POST', '/test/').respond({
            status: 'success',
            message: false,
            data: {
                filterRecord: [
                    { id: '1', name: '1', ticked: false },
                    { id: '2', name: '2', ticked: false },
                    { id: '3', name: '3', ticked: false }
                ]
            }
        });

        el = angular.element('<div isteven-multi-select filter-url="/test/" output-model="selectedTests" button-label="name" item-label="name" tick-property="ticked" selected-data="testData"></div>');
        template = $_compile(el)($scope);
        $scope.$digest();

        let initButton = angular.element(el.find('button')[0]);
        let selectAllButton = angular.element(el.find('div').children('div').children('div').children('button')[0]);
        let resetButton = angular.element(el.find('div').children('div').children('div').children('button')[2]);
        let inputFilter = angular.element(el.find('input'));

        initButton.triggerHandler('click');
        $httpBackend.flush();

        selectAllButton.triggerHandler('click');
        resetButton.triggerHandler('click');

        let firstTestSpan = template.find('div').children('div').children('div').next().next().children('span');
        //点击事件生效时页面上每个返回结果的button数量
        expect(firstTestSpan.find('button').length).to.equal(0);
    });

    //测试单选模式下的选中
    /*1.当页面上输入控件的指令时，验证会出现的页面元素
      2.当页面上输入控件的指令时，验证指令里面的model的值（未完成）
      3.当页面上输入控件的指令时，验证查询之后返回的结果（未完成）
    */
    it('test first button for selections', function() {
        $httpBackend.when('POST', '/test/').respond({
            status: 'success',
            message: false,
            data: {
                filterRecord: [
                    { id: '1', name: '1', ticked: false },
                    { id: '2', name: '2', ticked: false },
                    { id: '3', name: '3', ticked: false }
                ]
            }
        });
        let elem = angular.element('<button class="form-control pull-left ng-binding" />');
        el = angular.element('<div isteven-multi-select selection-mode="single" filter-url="/test/" output-model="selectedTests" button-label="name" item-label="name" tick-property="ticked" selected-data="testData"></div>');
        template = $_compile(el)($scope);
        $scope.$digest();

        let initButton = angular.element(el.find('button')[0]);

        initButton.triggerHandler('click');
        $httpBackend.flush();

        let firstTest = angular.element(el.find('div').children('div').next().children('div')[0]);
        expect(template.find('div').attr('class')).to.equal('checkboxLayer show');

        firstTest.triggerHandler('click');
        //点击事件生效时页面上对应返回结果的div属性
        expect(template.children('span').children().next().attr('class')).to.equal('checkboxLayer');
        expect(template.children('span').children().find('div').attr('class')).to.equal('buttonLabel  text-left');
        expect(angular.element(template.children('span').children().find('div')[0]).text()).to.equal(' 1');
    });
    //测试多选模式下的选中
    /*1.当页面上输入控件的指令时，验证会出现的页面元素
      2.当页面上输入控件的指令时，验证指令里面的model的值（未完成）
      3.当页面上输入控件的指令时，验证查询之后返回的结果（未完成）
    */
    it('test first button for selections', function() {
        $httpBackend.when('POST', '/test/').respond({
            status: 'success',
            message: false,
            data: {
                filterRecord: [
                    { id: '1', name: '1', ticked: false },
                    { id: '2', name: '2', ticked: false },
                    { id: '3', name: '3', ticked: false }
                ]
            }
        });
        let elem = angular.element('<button class="form-control pull-left ng-binding" />');
        el = angular.element('<div isteven-multi-select filter-url="/test/" output-model="selectedTests" button-label="name" item-label="name" tick-property="ticked" selected-data="testData"></div>');
        template = $_compile(el)($scope);
        $scope.$digest();

        let initButton = angular.element(el.find('button')[0]);

        initButton.triggerHandler('click');
        $httpBackend.flush();

        let firstTest = angular.element(el.find('div').children('div').next().children('div')[0]);
        let secondTest = firstTest.next();
        expect(template.find('div').attr('class')).to.equal('checkboxLayer show');

        firstTest.triggerHandler('click');
        secondTest.triggerHandler('click');

        let firstTestSpan = angular.element(template.find('div').children('div').children('div').next().next().children('span')[0]);
        let secondTestSpan = angular.element(template.find('div').children('div').children('div').next().next().children('span')[1]);

        //点击事件生效时页面上每个返回结果对应的span的属性
        expect(template.children('span').children().find('div').attr('class')).to.equal('buttonLabel  text-left');
        expect(firstTestSpan.text()).to.equal('x 1');
        expect(secondTestSpan.text()).to.equal('x 2');

    });
});
