/**
 * - 配置项：
 *  1. selection-mode：插件的功能模式（single：单选，默认是多选），optional；单选：没有select-all, select-none按钮，只有reset按钮。
 *  2. filter-url：从server端获取数据的地址，mandatory；
 *  3. selected-data: 默认初始选中的数据；
 *  4. output-model：已选项存放的array，mandatory；
 *  5. button-label：在插件按钮上显示的选中项的字段，mandatory；
 *  6. item-label：下拉选项显示的字段，mandatory；
 *  7. tick-property：判断是否已选的标志；
 *  8. filter-type：根据页面哪个元素id来联动过滤，optional；
 *  9. filter-data：联动过滤的数据，optional，如果filter-type填了，此项必填；
 *  10. selector-id：防止页面多个插件导致loadmore功能或其他功能冲突，传入每个插件的id。
 * - 操作：
 *  1. 页面load：当第一次进入页面时init一次，获取所有下面的数据，如果有配置selected-data，会有初始选中的选项，button label和插件上的label；
 *  2. 第一次点击插件：再init一次，如果第一次init时，已有数据的话，不去调server端；（分开判断null和[]）
 *  3. 按钮点击：select-all；全选；select-none：全不选。reset：原来选上的还是会被选上，没选的还是去掉选择；
 *  4. 选择一个item：如果是多选，只是把已选的样式改掉，单选的话，窗口会关闭，按钮上的label也会相应的改变，outputmodel里面会存放已选的数据；
 *     插件上面会有个已选项的label，点击会去掉选择状态；
 *  5. filter input：filter输入时，如果连续输入，则不会触发搜索功能，如果停止输入2s后，会去server端搜索。如果上次server端还没返回，这次搜索前，会把上次的调用停止，
 *  然后再去调用server端；输入框旁边的×，可以清楚框内的内容，然后过2s后，会自动再搜索一次；
 *  6. loadmore：
 *     初始只会加载前20条数据，如果一共有超过20条的数据的话，最下面会有个loadmore的提示，鼠标滚到底会等待1s后去server端加载另外20条数据，
 *     如果全部加载完了，或者这次加载没有20条，则不会再显示loadmore提示，也不会再触发加载功能；
 *  7. 和其他插件的联动加载：另外一个插件的已选项改变时，当前插件的下拉选项会自动做相应的修改，当前插件的已选项和button label也会自动清除。
 * _ 特殊情景：
 *  1. 页面load时，等待响应，点击展开时，验证是否会给服务器发送请求
 *  2. 页面load时如果服务响应超时，点击展开时，验证是否需要给服务器发送请求
 *  3. 第一次点击插件时，等待响应，再次点击时，验证是否会给服务器发送请求
 *  4. 第一次点击插件时，响应超时，再次点击时，验证是否会给服务器发送请求
 *  5. 输入filter时，如果查询结果还没返回的时候，继续输入其它内容，验证是否2s会再给服务器发送请求
 *  6. 输入filter时，如果查询结果返回超时，继续输入其它内容，验证是否2s会再给服务器发送请求
 *  7. 输入filter时，如果查询结果还没返回的时候，取消输入的内容，再次输入其它内容，验证是否2s会再给服务器发送请求
 *  8. 输入filter时，如果查询结果返回超时，取消输入的内容，验证是否2s会再给服务器发送请求
 *  9. loadMore时，如果结果还没有返回时，继续loadMore，验证是否会给服务器端发送请求
 *  10. loadMore时，如果结果返回超时，继续loadMore，验证是否会给服务器端发送请求
 *  11. 和其他插件联动加载时，如果两个插件都有select-data ,验证当第一个插件已选项改变时，第二个插件的选项是否会跟随着改变，并验证重置后的值
 **/
describe('test', function() {
    var $scope, $_compile, $httpBackend, el, template, test, $location, $anchorScroll;
    let getTest = function($injector, $compile, $rootScope) {
        $_compile = $compile;
        $scope = $rootScope.$new();

        $httpBackend = $injector.get('$httpBackend');
        $location = $injector.get('$location');
        $anchorScroll = $injector.get('$anchorScroll');
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
    /*1.当页面上输入控件的指令时，验证会出现的页面元素以及他们的属性
     */
    it('it should add this element', function() {
        el = angular.element('<div isteven-multi-select  output-model="">');
        template = $_compile(el)($scope);
        $scope.$digest();
        //指令生效时div的属性变化
        expect(template.attr('class')).to.equal('ng-scope ng-isolate-scope');
        expect(template.find('span').length).to.equal(2);
        expect(template.find('span').find('span').attr('class')).to.equal('caret');
        expect(template.find('span').attr('class')).to.equal('multiSelect inlineBlock');

        //指令生效时页面上的button数量以及展开按钮的属性
        expect(template.find('button').length).to.equal(5);
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
        expect(template.find('div').children('div').next().attr('id')).to.equal('');
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
        expect(template.find('input').attr('ng-change')).to.equal('searchChanged()');
        expect(template.find('input').attr('class')).to.equal('inputFilter ng-pristine ng-untouched ng-valid ng-empty');
    });
    //测试多选模式下组件的元素
    /*1.当页面上输入控件的指令时，验证会出现的页面元素以及他们的属性
     */
    it('it should add this element111', function() {
        el = angular.element('<div isteven-multi-select selection-mode="single" output-model="">');
        template = $_compile(el)($scope);
        $scope.$digest();
        //指令生效时div的属性变化
        expect(template.attr('class')).to.equal('ng-scope ng-isolate-scope');
        expect(template.find('span').length).to.equal(2);
        expect(template.find('span').find('span').attr('class')).to.equal('caret');
        expect(template.find('span').attr('class')).to.equal('multiSelect inlineBlock');

        //指令生效时页面上的button数量以及展开按钮的属性
        expect(template.find('button').length).to.equal(3);
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
        expect(template.find('input').attr('ng-change')).to.equal('searchChanged()');
        expect(template.find('input').attr('class')).to.equal('inputFilter ng-pristine ng-untouched ng-valid ng-empty');
    });

    it('it should add this element', function() {
        $httpBackend.when('POST', '/test/').respond({
            status: 'success',
            message: false,
            data: {
                filterRecord: [
                    { id: '1', name: '1', ticked: false }
                ]
            }
        });
        el = angular.element('<div isteven-multi-select  output-model="" filter-url="/test/" item-label="">');
        template = $_compile(el)($scope);
        $scope.$digest();
        let initButton = angular.element(el.find('button')[0]);
        initButton.triggerHandler('click');
        $httpBackend.flush();
        expect($scope.$$childTail.filterInputModel[0].id).to.equal('1');
        expect($scope.$$childTail.filterInputModel[0].name).to.equal('1');
        expect($scope.$$childTail.filterInputModel[0].ticked).to.equal(false);
    });

    /*it('it should add this element', function() {
        $httpBackend.when('POST', '/test/').respond({
            status: 'success',
            message: false,
            data: {
                filterRecord: [
                    { id: '1', name: '1', ticked: false }
                ]
            }
        });
        el = angular.element('<div isteven-multi-select  output-model="" filter-url="tet" item-label="">');
        template = $_compile(el)($scope);
        $scope.$digest();
        let initButton = angular.element(el.find('button')[0]);
        initButton.triggerHandler('click');
        $httpBackend.flush();
        expect($scope.$$childTail.filterInputModel[0].id).to.equal('1');
        expect($scope.$$childTail.filterInputModel[0].name).to.equal('1');
        expect($scope.$$childTail.filterInputModel[0].ticked).to.equal(false);
    });*/

    it('it should add this element', function() {
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
        el = angular.element('<div isteven-multi-select filter-url="/test/" selected-data= "testData" output-model="">');
        template = $_compile(el)($scope);
        $scope.$digest();
        console.log($scope.$$childTail.testData);

        /*$scope.$digest();
        $scope.$$childTail.testData=testData;
        console.log($scope.testData);
        console.log($scope.$$childTail.testData);
        //expect($scope.$$childTail).to.equal('1');*/
    });

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

        el = angular.element('<div isteven-multi-select selection-mode="single" filter-url="/test/" button-label="name" item-label="name" output-model="selectedTests"></div>');
        template = $_compile(el)($scope);
        $scope.$digest();
        let initButton = angular.element(el.find('button')[0]);
        initButton.triggerHandler('click');
        $httpBackend.flush();
        //点击事件生效时页面上的div数量
        let checkBoxContainerFirstDiv = template.find('div').children('div').next().children('div');
        expect(template.find('div').children('div').next().children('div').length).to.equal(7);
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
        console.log($scope.selectedTests);
    });

    //测试单选模式下组件里面的点击展开元素以及查询功能
    /*1.点击init按钮的出现的值的验证（包括页面的div的验证以及各个model里面的值验证）
     */
    xit('test first button for single selection', function() {
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
    /*1.点击全选按钮时的验证（页面的验证和各个model里面值的验证）
     */
    xit('test selectAll button', function() {
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
    /*1.点击全不选按钮时的验证（页面的验证和各个model里面值的验证）
     */
    xit('test selectNone button', function() {
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

        el = angular.element('<div isteven-multi-select filter-url="/test/" input-model="ss" output-model="selectedTests" button-label="name" item-label="name" tick-property="ticked" selected-data="testData"></div>');
        template = $_compile(el)($scope);
        $scope.$digest();
        let initButton = angular.element(el.find('button')[0]);
        let selectAllButton = angular.element(el.find('div').children('div').children('div').children('button')[0]);
        let selectNoneButton = angular.element(el.find('div').children('div').children('div').children('button')[1]);

        initButton.triggerHandler('click');
        $httpBackend.flush();

        selectAllButton.triggerHandler('click');
        //console.log($scope);
        selectNoneButton.triggerHandler('click');

        let firstTestSpan = template.find('div').children('div').children('div').next().next().children('span');

        //点击事件生效时页面上每个对应的结果的button数量
        expect(firstTestSpan.find('button').length).to.equal(0);
    });

    //测试多选模式下的查询输入框的功能
    /*1.查询输入框输入时的验证（页面的验证和各个model里面值的验证）
     */
    // currently we can not simulate the response result according to the search/filter condition, so we comment this 'it' for the time being, TODO, ...
    xit('test inputFilter', function() {
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
    //测试多选模式下的loadMore的功能
    /*1.loadMore时的验证（页面的验证和各个model里面值的验证）
     */
    it('test loadMore', function() {
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
        $httpBackend.when('POST', '/test/').respond(function(method, url, Data) {
            let datas = {
                status: 'success',
                message: false,
                data
            };
            return [200, datas];
        });

        el = angular.element('<div isteven-multi-select filter-url="/test/" output-model="selectedTests" button-label="name" item-label="name" tick-property="ticked" selected-data="testData" selector-id="selectedTest"></div>');
        template = $_compile(el)($scope);
        $scope.$digest();

        console.log(angular.element(template.find('div').children('div').next()[0]));
        let initButton = angular.element(el.find('button')[0]);

        initButton.triggerHandler('click');
        $httpBackend.flush();
        //console.log(angular.element(template.find('div').children('div').next()[0]));
        //$httpBackend.expectPOST('/test/');
        //console.log($scope.$$childTail.$id);
        let checkBoxContainerFirstDiv = template.find('div').children('div').next().children('div');
        // let elem = angular.element(template.find('div').children('div').next()[0]);
        let elem = angular.element(template.find('div').children('div').next()[0]);
        //console.log(angular.element(template.find('div').children('div').next().children('div')[19]));
        // elem = elem[0] || elem;
        //console.log(elem);
        console.log(elem.scrollHeight);
        // elem = elem[0] || elem;
        // $location.hash('loadMore');
        // $anchorScroll();
        // console.log('$location >>>>', $location);
        // console.log(elem.offsetHeight);
        // console.log(elem.scrollTop);


        // elem.offsetHeight = 1;
        //console.log($scope.filteredModel);
        //console.log(template.find('div').children('div').next().children('div'));
        //window.scrollTo(0, angular.element(template.find('div').children('div').next().children('div')[19]));
        console.log($scope.$$childTail.hasMore);
        //expect(template.find('div').children('div').next().children('div').length).to.equal(7);
        /*for (var j = 0; j < 40; j++) {
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
        }*/
    });

    // 测试多选模式下的重置按钮
    /*1.点击重置时的验证（页面的验证和各个model里面值的验证）
     */
    xit('test reset button', function() {
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
    /*1.点击选中时的验证（页面的验证和各个model里面值的验证）
     */
    xit('test first button for selections', function() {
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
    /*1.点击选中时的验证（页面的验证和各个model里面值的验证）
     */
    xit('test first button for selections', function() {
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
//当页面页面上同时出现两个multiSelect时,验证其是否冲突
