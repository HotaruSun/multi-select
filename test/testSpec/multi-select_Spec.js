/**
 * - 配置项：
 *  1. selection-mode：插件的功能模式（single：单选，默认是多选），optional；单选：没有select-all, select-none按钮，只有reset按钮。
 *  2. filter-url：从server端获取数据的地址，mandatory；
 *  3. init-data: 默认初始选中的数据；
 *  4. output-data：已选项存放的array，mandatory；
 *  5. button-label：在插件按钮上显示的选中项的字段，mandatory；
 *  6. item-label：下拉选项显示的字段，mandatory；
 *  7. tick-property：判断是否已选的标志；
 *  8. filter-type：根据页面哪个元素id来联动过滤，optional；
 *  9. filter-data：联动过滤的数据，optional，如果filter-type填了，此项必填；
 *  10. selector-id：防止页面多个插件导致loadmore功能或其他功能冲突，传入每个插件的id。
 *
 * - 操作：
 *  1. 页面load：当第一次进入页面时init一次，获取所有下面的数据，如果有配置init-data，会有初始选中的选项，button label和插件上的label；
 *  2. 第一次点击插件：再init一次，如果第一次init时，已有数据的话，不去调server端；（分开判断null和[]）
 *  3. 按钮点击：select-all；全选；select-none：全不选。reset：原来选上的还是会被选上，没选的还是去掉选择；
 *  4. 选择一个item：如果是多选，只是把已选的样式改掉，单选的话，窗口会关闭，按钮上的label也会相应的改变，outputData里面会存放已选的数据；
 *     插件上面会有个已选项的label，点击会去掉选择状态；
 *  5. filter input：filter输入时，如果连续输入，则不会触发搜索功能，如果停止输入2s后，会去server端搜索。如果上次server端还没返回，这次搜索前，会把上次的调用停止，
 *  然后再去调用server端；输入框旁边的×，可以清楚框内的内容，然后过2s后，会自动再搜索一次；
 *  6. loadmore：
 *     初始只会加载前20条数据，如果一共有超过20条的数据的话，最下面会有个loadmore的提示，鼠标滚到底会等待1s后去server端加载另外20条数据，
 *     如果全部加载完了，或者这次加载没有20条，则不会再显示loadmore提示，也不会再触发加载功能；
 *  7. 和其他插件的联动加载：另外一个插件的已选项改变时，当前插件的下拉选项会自动做相应的修改，当前插件的已选项和button label也会自动清除。
 *
 * - test spec：
 *  1. 页面load完，如果没有配置init-data，验证inputModel和outputData里是否有数据；
 *  2. 页面load完，如果配置了init-data，验证inputModel和outputData里是否有数据；
 *  3. 页面load完，点击页面插件时，验证inputmodel里的数据和post返回的是不是一样；
 *  4. 验证多选模式下，选择一项后，页面和outputData的变化；
 *  5. 验证多选模式下，分别选择一项，两项，三项，四项后，页面和outputData的变化，最后验证去掉一项后的变化；
 *  6. 验证单选模式下，选择一项后，点击另外一项后的页面和数据变化，并验证重复点击同一项时的变化；
 *  7. 验证多选模式下，选择一项后，点击另外一项后的页面和数据变化，并验证重复点击同一项时的变化；
 *  8. 输入完搜索字段后，在2s内不会去搜索，2s后会返回搜索结果，点击选择一条搜索结果后，再点击另外条结果，在多选模式下，会同时选中两条；
 *  9. 单选模式下，点击另外条结果后，会只选中最后点击的那条；
 *  10，测试多选模式下，如果配置了init-data，reset、selectnone和selectall按钮功能；
 *  11. 测试多选模式下，如果没有配置init-data，reset、selectnone和selectall按钮功能；
 *  12. 如果数据不超过20条，验证是否会触发loadmore功能；
 *  13. 如果数据超过20条，验证是否会触发loadmore功能；
 *  14. 和其他插件联动加载时，如果两个插件都有select-data ,验证当第一个插件已选项改变时，第二个插件的选项是否会跟随着改变，并验证重置后的值
 **/
describe('multi-selector unit test', function() {
    var $scope, compile, $httpBackend, elem, template, test, $anchorScroll, $timeout;
    var inputModel;
    let getTest = function($injector, $compile, $rootScope) {
        compile = $compile;
        $scope = $rootScope.$new(true);

        $httpBackend = $injector.get('$httpBackend');
        $anchorScroll = $injector.get('$anchorScroll');
        $timeout = $injector.get('$timeout');
    };

    beforeEach(function() {
        module('isteven-multi-select');
        inject(getTest);
    });

    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('#1 inputModel and outputData should be empty before click the selector when initData is not setted', function() {
        $httpBackend.expect('POST', '/multiselector/test/').respond({
            status: "success",
            message: false,
            data: {
                filterRecord: [
                    { id: '1', name: '松江' },
                    { id: '2', name: '徐汇' },
                    { id: '3', name: '闵行' },
                    { id: '4', name: '浦东' }
                ]
            }
        });
        template = angular.element('<div isteven-multi-select output-data="selectedTestIds" filter-url="/multiselector/test/" item-label="name" button-label="name" selector-id="testSelector">');
        elem = compile(template)($scope);
        $scope.$digest();
        $scope.selectedTestIds = [];
        expect(angular.element(elem[0]).attr('filter-url')).to.equal($scope.$$childTail.filterUrl);
        let selectorId = angular.element(elem[0]).attr('selector-id');
        expect(selectorId).to.equal($scope.$$childTail.selectorId);
        // inputModel is empty before click the selector
        expect($scope.$$childTail.inputModel.length).to.equal(0);
        expect(typeof($scope.$$childTail.outputData)).to.equal('undefined');

        let initButton = angular.element(elem.find('button')[0]);
        initButton.triggerHandler('click');
        $httpBackend.flush();
        expect($scope.$$childTail.outputData.length).to.equal(0);

        // check the inputmodel
        inputModel = $scope.$$childTail.inputModel;
        expect(inputModel[0].id).to.equal('1');
        expect(inputModel[1].id).to.equal('2');
        expect(inputModel[2].id).to.equal('3');
        expect(inputModel[3].id).to.equal('4');
        expect(inputModel[0].name).to.equal('松江');
        expect(inputModel[1].name).to.equal('徐汇');
        expect(inputModel[2].name).to.equal('闵行');
        expect(inputModel[3].name).to.equal('浦东');
    });

    it('#2 inputModel should be empty and ouputData is not empty before click the selector when initData is setted', function() {
        $httpBackend.expect('POST', '/admin/multiselector/intitdata').respond({
            status: "success",
            message: false,
            data: {
                filterRecord: [
                    { id: '1', name: '松江' },
                    { id: '2', name: '徐汇' }
                ]
            }
        });
        $scope.testInitData = ['1', '2'];
        template = angular.element('<div isteven-multi-select output-data="selectedTestIds" filter-url="/multiselector/test/" item-label="name" button-label="name" selector-id="testSelector" init-data="testInitData">');
        elem = compile(template)($scope);
        $scope.$digest();
        $scope.selectedTestIds = [];
        expect(angular.element(elem[0]).attr('filter-url')).to.equal($scope.$$childTail.filterUrl);
        let selectorId = angular.element(elem[0]).attr('selector-id');
        expect(selectorId).to.equal($scope.$$childTail.selectorId);
        $httpBackend.flush();
        // inputModel is empty before click the selector
        expect($scope.$$childTail.inputModel.length).to.equal(0);
        expect($scope.$$childTail.outputData.length).to.equal(2);
        $scope.$$childTail.outputData[0].id = '1';
        $scope.$$childTail.outputData[0].name = '松江';
        $scope.$$childTail.outputData[1].id = '2';
        $scope.$$childTail.outputData[0].name = '徐汇';
        // check the button label
        let initButton = angular.element(elem.find('button')[0]);
        expect(initButton.text()).to.contain('松江, ... 等2项');
        expect(initButton.text()).not.to.contain('闵行');
        expect(initButton.text()).not.to.contain('浦东');

        $httpBackend.expect('POST', '/multiselector/test/').respond({
            status: "success",
            message: false,
            data: {
                filterRecord: [
                    { id: '1', name: '松江' },
                    { id: '2', name: '徐汇' },
                    { id: '3', name: '闵行' },
                    { id: '4', name: '浦东' }
                ]
            }
        });
        initButton.triggerHandler('click');
        $httpBackend.flush();

        // check the inputmodel
        inputModel = $scope.$$childTail.inputModel;
        expect(inputModel[0].id).to.equal('1');
        expect(inputModel[1].id).to.equal('2');
        expect(inputModel[2].id).to.equal('3');
        expect(inputModel[3].id).to.equal('4');
        expect(inputModel[0].name).to.equal('松江');
        expect(inputModel[1].name).to.equal('徐汇');
        expect(inputModel[2].name).to.equal('闵行');
        expect(inputModel[3].name).to.equal('浦东');
        let sjItem = elem.find('div').children().eq(2).children().eq(0);
        let xhItem = elem.find('div').children().eq(2).children().eq(1);
        let mhItem = elem.find('div').children().eq(2).children().eq(2);
        let pdItem = elem.find('div').children().eq(2).children().eq(3);
        // click '松江'
        angular.element(sjItem).triggerHandler('click');
        // check the ticked item in inputmodel
        expect(inputModel[0].ticked).not.to.equal(true);
        expect(inputModel[1].ticked).to.equal(true);
        expect(inputModel[2].ticked).not.to.equal(true);
        expect(inputModel[3].ticked).not.to.equal(true);
        // check the button label
        expect(initButton.text()).not.to.contain('松江');
        expect(initButton.text()).to.contain('徐汇');
        expect(initButton.text()).not.to.contain('闵行');
        expect(initButton.text()).not.to.contain('浦东');
        // check the outputData
        var outputData = $scope.$$childTail.outputData;
        expect(outputData.length).to.equal(1);
        expect(outputData[0].id).to.equal('2');
        expect(outputData[0].name).to.equal('徐汇');
        // check the page attributes
        expect(xhItem.attr('class')).to.contain('selected');
        expect(xhItem.find('input').attr('checked')).to.equal('checked');
        expect(typeof xhItem.find('span')).not.to.equal('undefined');
        // check the title
        let titleButtons = elem.find('div').eq(1).children('div').eq(0).children('div').eq(2).children();
        expect(titleButtons.length).to.equal(1);
        expect(titleButtons.eq(0).text()).to.equal('x 徐汇');

        delete $scope.testInitData;
    });

    it('#3 inputmodel should be equal the post response after clicking the selector', function() {
        $httpBackend.expect('POST', '/multiselector/test/').respond({
            status: "success",
            message: false,
            data: {
                filterRecord: [
                    { id: '1', name: '松江' },
                    { id: '2', name: '徐汇' },
                    { id: '3', name: '闵行' },
                    { id: '4', name: '浦东' }
                ]
            }
        });
        template = angular.element('<div isteven-multi-select output-data="selectedTestIds" filter-url="/multiselector/test/" item-label="name" button-label="name" selector-id="testSelector">');
        elem = compile(template)($scope);
        $scope.$digest();
        $scope.selectedTestIds = [];
        expect(angular.element(elem[0]).attr('filter-url')).to.equal($scope.$$childTail.filterUrl);
        let selectorId = angular.element(elem[0]).attr('selector-id');
        expect(selectorId).to.equal($scope.$$childTail.selectorId);
        let initButton = angular.element(elem.find('button')[0]);
        initButton.triggerHandler('click');
        $httpBackend.flush();

        // check the inputmodel
        inputModel = $scope.$$childTail.inputModel;
        expect(inputModel[0].id).to.equal('1');
        expect(inputModel[1].id).to.equal('2');
        expect(inputModel[2].id).to.equal('3');
        expect(inputModel[3].id).to.equal('4');
        expect(inputModel[0].name).to.equal('松江');
        expect(inputModel[1].name).to.equal('徐汇');
        expect(inputModel[2].name).to.equal('闵行');
        expect(inputModel[3].name).to.equal('浦东');
    });

    it('#4 it should no items ticked default when init-data is empty, then click one item in multi mode', function() {
        $httpBackend.expect('POST', '/multiselector/test/').respond({
            status: "success",
            message: false,
            data: {
                filterRecord: [
                    { id: '1', name: '松江' },
                    { id: '2', name: '徐汇' },
                    { id: '3', name: '闵行' },
                    { id: '4', name: '浦东' }
                ]
            }
        });
        template = angular.element('<div isteven-multi-select output-data="selectedTestIds" filter-url="/multiselector/test/" item-label="name" button-label="name" selector-id="testSelector">');
        elem = compile(template)($scope);
        $scope.$digest();
        $scope.selectedTestIds = [];
        expect(angular.element(elem[0]).attr('filter-url')).to.equal($scope.$$childTail.filterUrl);
        let selectorId = angular.element(elem[0]).attr('selector-id');
        expect(selectorId).to.equal($scope.$$childTail.selectorId);
        let initButton = angular.element(elem.find('button')[0]);
        initButton.triggerHandler('click');
        $httpBackend.flush();

        let itemButton = elem.find('div').children().eq(1).children().eq(0);
        itemButton.triggerHandler('click');

        /*after click a item*/
        inputModel = $scope.$$childTail.inputModel;
        // check the ticked item in inputmodel
        expect(inputModel[0].ticked).to.equal(true);
        expect(inputModel[1].ticked).not.to.equal(true);
        expect(inputModel[2].ticked).not.to.equal(true);
        expect(inputModel[3].ticked).not.to.equal(true);

        // check the page attributes
        expect(itemButton.attr('class')).to.contain('selected');
        expect(itemButton.find('input').attr('checked')).to.equal('checked');
        expect(typeof itemButton.find('span')).not.to.equal('undefined');

        // check the button label
        expect(elem.find('button').children().text()).to.contain('松江');

        // check the outputData
        expect($scope.$$childTail.outputData.length).to.equal(1);
        expect($scope.$$childTail.outputData[0].id).to.equal('1');
        expect($scope.$$childTail.outputData[0].name).to.equal('松江');

        // check the title
        let titleButtons = elem.find('div').eq(1).children('div').eq(0).children('div').eq(2).children();
        expect(titleButtons.length).to.equal(1);
        expect(titleButtons.eq(0).text()).to.equal('x 松江');
    });

    it('#5 it should no items ticked default when init-data is empty, then click some items in multi model', function() {
        $httpBackend.expect('POST', '/multiselector/test/').respond({
            status: "success",
            message: false,
            data: {
                filterRecord: [
                    { id: '1', name: '松江' },
                    { id: '2', name: '徐汇' },
                    { id: '3', name: '闵行' },
                    { id: '4', name: '浦东' }
                ]
            }
        });
        template = angular.element('<div isteven-multi-select output-data="selectedTestIds" filter-url="/multiselector/test/" item-label="name" button-label="name" selector-id="testSelector">');
        elem = compile(template)($scope);
        $scope.$digest();
        $scope.selectedTestIds = [];
        expect(angular.element(elem[0]).attr('filter-url')).to.equal($scope.$$childTail.filterUrl);
        let selectorId = angular.element(elem[0]).attr('selector-id');
        expect(selectorId).to.equal($scope.$$childTail.selectorId);
        let initButton = angular.element(elem.find('button')[0]);
        initButton.triggerHandler('click');
        $httpBackend.flush();

        // check the inputmodel
        inputModel = $scope.$$childTail.inputModel;
        expect(inputModel[0].id).to.equal('1');
        expect(inputModel[1].id).to.equal('2');
        expect(inputModel[2].id).to.equal('3');
        expect(inputModel[3].id).to.equal('4');
        expect(inputModel[0].name).to.equal('松江');
        expect(inputModel[1].name).to.equal('徐汇');
        expect(inputModel[2].name).to.equal('闵行');
        expect(inputModel[3].name).to.equal('浦东');

        let sjItem = elem.find('div').children().eq(1).children().eq(0);
        let xhItem = elem.find('div').children().eq(1).children().eq(1);
        let mhItem = elem.find('div').children().eq(1).children().eq(2);
        let pdItem = elem.find('div').children().eq(1).children().eq(3);

        /* click '松江' */
        angular.element(sjItem).triggerHandler('click');
        // check the ticked item in inputmodel
        expect(inputModel[0].ticked).to.equal(true);
        expect(inputModel[1].ticked).not.to.equal(true);
        expect(inputModel[2].ticked).not.to.equal(true);
        expect(inputModel[3].ticked).not.to.equal(true);
        // check ther button label
        expect(initButton.text()).to.contain('松江');
        expect(initButton.text()).not.to.contain('徐汇');
        expect(initButton.text()).not.to.contain('闵行');
        expect(initButton.text()).not.to.contain('浦东');
        // check the outputData
        var outputData = $scope.$$childTail.outputData;
        expect(outputData.length).to.equal(1);
        expect(outputData[0].id).to.equal('1');
        expect(outputData[0].name).to.equal('松江');
        // check the page attributes
        expect(sjItem.attr('class')).to.contain('selected');
        expect(sjItem.find('input').attr('checked')).to.equal('checked');
        expect(typeof sjItem.find('span')).not.to.equal('undefined');
        // check the title
        let titleButtons = elem.find('div').eq(1).children('div').eq(0).children('div').eq(2).children();
        expect(titleButtons.length).to.equal(1);
        expect(titleButtons.eq(0).text()).to.equal('x 松江');

        /* click '徐汇' */
        angular.element(xhItem).triggerHandler('click');
        // check the ticked item in inputmodel
        expect(inputModel[0].ticked).to.equal(true);
        expect(inputModel[1].ticked).to.equal(true);
        expect(inputModel[2].ticked).not.to.equal(true);
        expect(inputModel[3].ticked).not.to.equal(true);
        // check ther button label
        expect(initButton.text()).to.contain('松江, ... 等2项');
        expect(initButton.text()).not.to.contain('闵行');
        expect(initButton.text()).not.to.contain('浦东');
        // check the outputData
        outputData = $scope.$$childTail.outputData;
        expect(outputData.length).to.equal(2);
        expect(outputData[0].id).to.equal('1');
        expect(outputData[0].name).to.equal('松江');
        expect(outputData[1].id).to.equal('2');
        expect(outputData[1].name).to.equal('徐汇');
        // check the page attributes
        expect(sjItem.attr('class')).to.contain('selected');
        expect(sjItem.find('input').attr('checked')).to.equal('checked');
        expect(typeof sjItem.find('span')).not.to.equal('undefined');
        expect(xhItem.attr('class')).to.contain('selected');
        expect(xhItem.find('input').attr('checked')).to.equal('checked');
        expect(typeof xhItem.find('span')).not.to.equal('undefined');
        // check the title
        titleButtons = elem.find('div').eq(1).children('div').eq(0).children('div').eq(2).children();
        expect(titleButtons.length).to.equal(2);
        expect(titleButtons.eq(0).text()).to.equal('x 松江');
        expect(titleButtons.eq(1).text()).to.equal('x 徐汇');

        /* click '闵行' */

        angular.element(mhItem).triggerHandler('click');
        // check the ticked item in inputmodel
        expect(inputModel[0].ticked).to.equal(true);
        expect(inputModel[1].ticked).to.equal(true);
        expect(inputModel[2].ticked).to.equal(true);
        expect(inputModel[3].ticked).not.to.equal(true);
        // check ther button label
        expect(initButton.text()).to.contain('松江, ... 等3项');
        expect(initButton.text()).not.to.contain('浦东');
        // check the outputData
        outputData = $scope.$$childTail.outputData;
        expect(outputData.length).to.equal(3);
        expect(outputData[0].id).to.equal('1');
        expect(outputData[0].name).to.equal('松江');
        expect(outputData[1].id).to.equal('2');
        expect(outputData[1].name).to.equal('徐汇');
        expect(outputData[2].id).to.equal('3');
        expect(outputData[2].name).to.equal('闵行');
        // check the page attributes
        expect(sjItem.attr('class')).to.contain('selected');
        expect(sjItem.find('input').attr('checked')).to.equal('checked');
        expect(typeof sjItem.find('span')).not.to.equal('undefined');
        expect(xhItem.attr('class')).to.contain('selected');
        expect(xhItem.find('input').attr('checked')).to.equal('checked');
        expect(typeof xhItem.find('span')).not.to.equal('undefined');
        expect(mhItem.attr('class')).to.contain('selected');
        expect(mhItem.find('input').attr('checked')).to.equal('checked');
        expect(typeof mhItem.find('span')).not.to.equal('undefined');
        // check the title
        titleButtons = elem.find('div').eq(1).children('div').eq(0).children('div').eq(2).children();
        expect(titleButtons.length).to.equal(3);
        expect(titleButtons.eq(0).text()).to.equal('x 松江');
        expect(titleButtons.eq(1).text()).to.equal('x 徐汇');
        expect(titleButtons.eq(2).text()).to.equal('x 闵行');

        /* click '浦东' */
        angular.element(pdItem).triggerHandler('click');
        // check the ticked item in inputmodel
        expect(inputModel[0].ticked).to.equal(true);
        expect(inputModel[1].ticked).to.equal(true);
        expect(inputModel[2].ticked).to.equal(true);
        expect(inputModel[3].ticked).to.equal(true);
        // check ther button label
        expect(initButton.text()).to.contain('松江, ... 等4项');
        // check the outputData
        outputData = $scope.$$childTail.outputData;
        expect(outputData.length).to.equal(4);
        expect(outputData[0].id).to.equal('1');
        expect(outputData[0].name).to.equal('松江');
        expect(outputData[1].id).to.equal('2');
        expect(outputData[1].name).to.equal('徐汇');
        expect(outputData[2].id).to.equal('3');
        expect(outputData[2].name).to.equal('闵行');
        expect(outputData[3].id).to.equal('4');
        expect(outputData[3].name).to.equal('浦东');
        // check the page attributes
        expect(sjItem.attr('class')).to.contain('selected');
        expect(sjItem.find('input').attr('checked')).to.equal('checked');
        expect(typeof sjItem.find('span')).not.to.equal('undefined');
        expect(xhItem.attr('class')).to.contain('selected');
        expect(xhItem.find('input').attr('checked')).to.equal('checked');
        expect(typeof xhItem.find('span')).not.to.equal('undefined');
        expect(mhItem.attr('class')).to.contain('selected');
        expect(mhItem.find('input').attr('checked')).to.equal('checked');
        expect(typeof mhItem.find('span')).not.to.equal('undefined');
        expect(pdItem.attr('class')).to.contain('selected');
        expect(pdItem.find('input').attr('checked')).to.equal('checked');
        expect(typeof pdItem.find('span')).not.to.equal('undefined');
        // check the title
        titleButtons = elem.find('div').eq(1).children('div').eq(0).children('div').eq(2).children();
        expect(titleButtons.length).to.equal(4);
        expect(titleButtons.eq(0).text()).to.equal('x 松江');
        expect(titleButtons.eq(1).text()).to.equal('x 徐汇');
        expect(titleButtons.eq(2).text()).to.equal('x 闵行');
        expect(titleButtons.eq(3).text()).to.equal('x 浦东');

        /* click '浦东' again */
        angular.element(pdItem).triggerHandler('click');
        // check the ticked item in inputmodel
        expect(inputModel[0].ticked).to.equal(true);
        expect(inputModel[1].ticked).to.equal(true);
        expect(inputModel[2].ticked).to.equal(true);
        expect(inputModel[3].ticked).to.equal(false);
        // check ther button label
        expect(initButton.text()).to.contain('松江, ... 等3项');
        // check the outputData
        outputData = $scope.$$childTail.outputData;
        expect(outputData.length).to.equal(3);
        expect(outputData[0].id).to.equal('1');
        expect(outputData[0].name).to.equal('松江');
        expect(outputData[1].id).to.equal('2');
        expect(outputData[1].name).to.equal('徐汇');
        expect(outputData[2].id).to.equal('3');
        expect(outputData[2].name).to.equal('闵行');
        // check the page attributes
        expect(sjItem.attr('class')).to.contain('selected');
        expect(sjItem.find('input').attr('checked')).to.equal('checked');
        expect(typeof sjItem.find('span')).not.to.equal('undefined');
        expect(xhItem.attr('class')).to.contain('selected');
        expect(xhItem.find('input').attr('checked')).to.equal('checked');
        expect(typeof xhItem.find('span')).not.to.equal('undefined');
        expect(mhItem.attr('class')).to.contain('selected');
        expect(mhItem.find('input').attr('checked')).to.equal('checked');
        expect(typeof mhItem.find('span')).not.to.equal('undefined');
        expect(pdItem.attr('class')).not.to.contain('selected');
        expect(typeof pdItem.find('input').attr('checked')).to.equal('undefined');
        // check the title
        titleButtons = elem.find('div').eq(1).children('div').eq(0).children('div').eq(2).children();
        expect(titleButtons.length).to.equal(3);
        expect(titleButtons.eq(0).text()).to.equal('x 松江');
        expect(titleButtons.eq(1).text()).to.equal('x 徐汇');
        expect(titleButtons.eq(2).text()).to.equal('x 闵行');
    });

    it('#6 it should tick other item after click other item when one item is ticked in single mode', function() {
        $httpBackend.expect('POST', '/multiselector/test/').respond({
            status: "success",
            message: false,
            data: {
                filterRecord: [
                    { id: '1', name: '松江' },
                    { id: '2', name: '徐汇' },
                    { id: '3', name: '闵行' },
                    { id: '4', name: '浦东' }
                ]
            }
        });
        template = angular.element('<div isteven-multi-select output-data="selectedTestIds" filter-url="/multiselector/test/" item-label="name" button-label="name" selector-id="testSelector" selection-mode="single">');
        elem = compile(template)($scope);
        $scope.$digest();
        $scope.selectedTestIds = [];
        expect(elem.attr('filter-url')).to.equal($scope.$$childTail.filterUrl);
        expect(elem.attr('selector-id')).to.equal($scope.$$childTail.selectorId);
        let initButton = angular.element(elem.find('button')[0]);
        initButton.triggerHandler('click');
        $httpBackend.flush();

        inputModel = $scope.$$childTail.inputModel;
        expect(inputModel[0].id).to.equal('1');
        expect(inputModel[1].id).to.equal('2');
        expect(inputModel[2].id).to.equal('3');
        expect(inputModel[3].id).to.equal('4');
        expect(inputModel[0].name).to.equal('松江');
        expect(inputModel[1].name).to.equal('徐汇');
        expect(inputModel[2].name).to.equal('闵行');
        expect(inputModel[3].name).to.equal('浦东');

        let sjItem = elem.find('div').children().eq(1).children().eq(0);
        let xhItem = elem.find('div').children().eq(1).children().eq(1);
        let mhItem = elem.find('div').children().eq(1).children().eq(2);
        let pdItem = elem.find('div').children().eq(1).children().eq(3);

        /* click '松江' */
        // first tick one item
        sjItem.triggerHandler('click');
        // check the ticked item in inputmodel
        expect(inputModel[0].ticked).to.equal(true);
        expect(inputModel[1].ticked).to.equal(false);
        expect(inputModel[2].ticked).to.equal(false);
        expect(inputModel[3].ticked).to.equal(false);
        // check ther button label
        expect(initButton.text()).to.contain('松江');
        // check the outputData
        var outputData = $scope.$$childTail.outputData;
        expect(outputData.length).to.equal(1);
        expect(outputData[0].id).to.equal('1');
        expect(outputData[0].name).to.equal('松江');
        // check the page attributes
        expect(sjItem.attr('class')).to.contain('selected');
        expect(sjItem.find('input').attr('checked')).to.equal('checked');
        expect(typeof sjItem.find('span')).not.to.equal('undefined');
        expect(xhItem.attr('class')).not.to.contain('selected');
        expect(typeof xhItem.find('input').attr('checked')).to.equal('undefined');
        expect(mhItem.attr('class')).not.to.contain('selected');
        expect(typeof mhItem.find('input').attr('checked')).to.equal('undefined');
        expect(pdItem.attr('class')).not.to.contain('selected');
        expect(typeof pdItem.find('input').attr('checked')).to.equal('undefined');
        // check the title
        var titleButtons = elem.find('div').eq(1).children('div').eq(0).children('div').eq(2).children();
        expect(titleButtons.length).to.equal(1);
        expect(titleButtons.eq(0).text()).to.equal('x 松江');

        // then click other item
        /* click '徐汇' */
        xhItem.triggerHandler('click');
         // check the ticked item in inputmodel
        expect(inputModel[0].ticked).to.equal(false);
        expect(inputModel[1].ticked).to.equal(true);
        expect(inputModel[2].ticked).to.equal(false);
        expect(inputModel[3].ticked).to.equal(false);
        // check ther button label
        expect(initButton.text()).to.contain('徐汇');
        // check the outputData
        outputData = $scope.$$childTail.outputData;
        expect(outputData.length).to.equal(1);
        expect(outputData[0].id).to.equal('2');
        expect(outputData[0].name).to.equal('徐汇');
        // check the page attributes
        expect(sjItem.attr('class')).not.to.contain('selected');
        expect(typeof sjItem.find('input').attr('checked')).to.equal('undefined');
        expect(xhItem.attr('class')).to.contain('selected');
        expect(xhItem.find('input').attr('checked')).to.equal('checked');
        expect(typeof xhItem.find('span')).not.to.equal('undefined');
        expect(mhItem.attr('class')).not.to.contain('selected');
        expect(typeof mhItem.find('input').attr('checked')).to.equal('undefined');
        expect(pdItem.attr('class')).not.to.contain('selected');
        expect(typeof pdItem.find('input').attr('checked')).to.equal('undefined');
        // check the title
        titleButtons = elem.find('div').eq(1).children('div').eq(0).children('div').eq(2).children();
        expect(titleButtons.length).to.equal(1);
        expect(titleButtons.eq(0).text()).to.equal('x 徐汇');

        /* click '徐汇' again */
        xhItem.triggerHandler('click');
         // check the ticked item in inputmodel
        expect(inputModel[0].ticked).to.equal(false);
        expect(inputModel[1].ticked).to.equal(true);
        expect(inputModel[2].ticked).to.equal(false);
        expect(inputModel[3].ticked).to.equal(false);
        // check ther button label
        expect(initButton.text()).to.contain('徐汇');
        // check the outputData
        outputData = $scope.$$childTail.outputData;
        expect(outputData.length).to.equal(1);
        expect(outputData[0].id).to.equal('2');
        expect(outputData[0].name).to.equal('徐汇');
        // check the page attributes
        expect(sjItem.attr('class')).not.to.contain('selected');
        expect(typeof sjItem.find('input').attr('checked')).to.equal('undefined');
        expect(xhItem.attr('class')).to.contain('selected');
        expect(xhItem.find('input').attr('checked')).to.equal('checked');
        expect(typeof xhItem.find('span')).not.to.equal('undefined');
        expect(mhItem.attr('class')).not.to.contain('selected');
        expect(typeof mhItem.find('input').attr('checked')).to.equal('undefined');
        expect(pdItem.attr('class')).not.to.contain('selected');
        expect(typeof pdItem.find('input').attr('checked')).to.equal('undefined');
        // check the title
        titleButtons = elem.find('div').eq(1).children('div').eq(0).children('div').eq(2).children();
        expect(titleButtons.length).to.equal(1);
        expect(titleButtons.eq(0).text()).to.equal('x 徐汇');
    });

    it('#7 it should tick both items after click other item when one item is ticked in multi mode', function() {
        $httpBackend.expect('POST', '/multiselector/test/').respond({
            status: "success",
            message: false,
            data: {
                filterRecord: [
                    { id: '1', name: '松江' },
                    { id: '2', name: '徐汇' },
                    { id: '3', name: '闵行' },
                    { id: '4', name: '浦东' }
                ]
            }
        });
        template = angular.element('<div isteven-multi-select output-data="selectedTestIds" filter-url="/multiselector/test/" item-label="name" button-label="name" selector-id="testSelector">');
        elem = compile(template)($scope);
        $scope.$digest();
        $scope.selectedTestIds = [];
        expect(elem.attr('filter-url')).to.equal($scope.$$childTail.filterUrl);
        expect(elem.attr('selector-id')).to.equal($scope.$$childTail.selectorId);
        let initButton = angular.element(elem.find('button')[0]);
        initButton.triggerHandler('click');
        $httpBackend.flush();

        inputModel = $scope.$$childTail.inputModel;
        expect(inputModel[0].id).to.equal('1');
        expect(inputModel[1].id).to.equal('2');
        expect(inputModel[2].id).to.equal('3');
        expect(inputModel[3].id).to.equal('4');
        expect(inputModel[0].name).to.equal('松江');
        expect(inputModel[1].name).to.equal('徐汇');
        expect(inputModel[2].name).to.equal('闵行');
        expect(inputModel[3].name).to.equal('浦东');

        let sjItem = elem.find('div').children().eq(1).children().eq(0);
        let xhItem = elem.find('div').children().eq(1).children().eq(1);
        let mhItem = elem.find('div').children().eq(1).children().eq(2);
        let pdItem = elem.find('div').children().eq(1).children().eq(3);

        /* click '松江' */
        // first tick one item
        sjItem.triggerHandler('click');
        // check the ticked item in inputmodel
        expect(inputModel[0].ticked).to.equal(true);
        expect(typeof(inputModel[1].ticked)).to.equal('undefined');
        expect(typeof(inputModel[2].ticked)).to.equal('undefined');
        expect(typeof(inputModel[3].ticked)).to.equal('undefined');
        // check ther button label
        expect(initButton.text()).to.contain('松江');
        // check the outputData
        var outputData = $scope.$$childTail.outputData;
        expect(outputData.length).to.equal(1);
        expect(outputData[0].id).to.equal('1');
        expect(outputData[0].name).to.equal('松江');
        // check the page attributes
        expect(sjItem.attr('class')).to.contain('selected');
        expect(sjItem.find('input').attr('checked')).to.equal('checked');
        expect(typeof sjItem.find('span')).not.to.equal('undefined');
        expect(xhItem.attr('class')).not.to.contain('selected');
        expect(typeof xhItem.find('input').attr('checked')).to.equal('undefined');
        expect(mhItem.attr('class')).not.to.contain('selected');
        expect(typeof mhItem.find('input').attr('checked')).to.equal('undefined');
        expect(pdItem.attr('class')).not.to.contain('selected');
        expect(typeof pdItem.find('input').attr('checked')).to.equal('undefined');
        // check the title
        var titleButtons = elem.find('div').eq(1).children('div').eq(0).children('div').eq(2).children();
        expect(titleButtons.length).to.equal(1);
        expect(titleButtons.eq(0).text()).to.equal('x 松江');

        // then click other item
        /* click '徐汇' */
        xhItem.triggerHandler('click');
         // check the ticked item in inputmodel
        expect(inputModel[0].ticked).to.equal(true);
        expect(inputModel[1].ticked).to.equal(true);
        expect(typeof(inputModel[2].ticked)).to.equal('undefined');
        expect(typeof(inputModel[3].ticked)).to.equal('undefined');
        // check ther button label
        expect(initButton.text()).to.contain('松江, ... 等2项');
        // check the outputData
        outputData = $scope.$$childTail.outputData;
        expect(outputData.length).to.equal(2);
        expect(outputData[0].id).to.equal('1');
        expect(outputData[0].name).to.equal('松江');
        expect(outputData[1].id).to.equal('2');
        expect(outputData[1].name).to.equal('徐汇');
        // check the page attributes
        expect(sjItem.attr('class')).to.contain('selected');
        expect(sjItem.find('input').attr('checked')).to.equal('checked');
        expect(typeof sjItem.find('span')).not.to.equal('undefined');
        expect(xhItem.attr('class')).to.contain('selected');
        expect(xhItem.find('input').attr('checked')).to.equal('checked');
        expect(typeof xhItem.find('span')).not.to.equal('undefined');
        expect(mhItem.attr('class')).not.to.contain('selected');
        expect(typeof mhItem.find('input').attr('checked')).to.equal('undefined');
        expect(pdItem.attr('class')).not.to.contain('selected');
        expect(typeof pdItem.find('input').attr('checked')).to.equal('undefined');
        // check the title
        titleButtons = elem.find('div').eq(1).children('div').eq(0).children('div').eq(2).children();
        expect(titleButtons.length).to.equal(2);
        expect(titleButtons.eq(0).text()).to.equal('x 松江');
        expect(titleButtons.eq(1).text()).to.equal('x 徐汇');
    });

    it('#8 it should be ok filtered after 2s in multi mode', function() {
        $httpBackend.whenPOST('/multiselector/test/').respond(function(method, url, rData, headers) {
            var data = {};
            rData = JSON.parse(rData);
            if (rData.flag === 'init') {
                data = {
                    status: 'success',
                    message: false,
                    data: {
                        filterRecord: [
                            { id: '1', name: '松江' },
                            { id: '2', name: '徐汇' },
                            { id: '3', name: '闵行' },
                            { id: '4', name: '浦东' }
                        ]
                    }
                };
            } else if(rData.flag === 'filter') {
                if (rData.filterName === '松江') {
                    data = {
                        status: 'success',
                        message: false,
                        data: {
                            filterRecord: [
                                { id: '1', name: '松江' },
                                { id: '5', name: '松江2' }
                            ]
                        }
                    };
                } else if(rData.filterName === '松') {
                    data = {
                        status: 'success',
                        message: false,
                        data: {
                            filterRecord: [
                                { id: '1', name: '松江' },
                                { id: '5', name: '松江2' },
                                { id: '6', name: '松卫北路' }
                            ]
                        }
                    };
                } else {
                    data = {
                        status: 'success',
                        message: false,
                        data: {
                            filterRecord: [
                                { id: '1', name: '松江' },
                                { id: '2', name: '徐汇' },
                                { id: '3', name: '闵行' },
                                { id: '4', name: '浦东' }
                            ]
                        }
                    };
                }
            }
            return [200, data, {}];
        });
        template = angular.element('<div isteven-multi-select output-data="selectedTestIds" filter-url="/multiselector/test/" item-label="name" button-label="name" selector-id="testSelector">');
        elem = compile(template)($scope);
        $scope.$digest();
        $scope.selectedTestIds = [];
        expect(elem.attr('filter-url')).to.equal($scope.$$childTail.filterUrl);
        expect(elem.attr('selector-id')).to.equal($scope.$$childTail.selectorId);
        let initButton = angular.element(elem.find('button')[0]);
        initButton.triggerHandler('click');
        $httpBackend.flush();

        inputModel = $scope.$$childTail.inputModel;
        expect(inputModel[0].id).to.equal('1');
        expect(inputModel[1].id).to.equal('2');
        expect(inputModel[2].id).to.equal('3');
        expect(inputModel[3].id).to.equal('4');
        expect(inputModel[0].name).to.equal('松江');
        expect(inputModel[1].name).to.equal('徐汇');
        expect(inputModel[2].name).to.equal('闵行');
        expect(inputModel[3].name).to.equal('浦东');

        elem.find('input').val('松江');
        elem.find('input').triggerHandler('input');
        $timeout.flush(2000); // sleep 2s to wait filter
        $httpBackend.flush();
        expect($scope.$$childTail.filteredModel.length).to.equal(2);
        expect($scope.$$childTail.filteredModel[0].id).to.equal('1');
        expect($scope.$$childTail.filteredModel[0].name).to.equal('松江');
        expect($scope.$$childTail.filteredModel[1].id).to.equal('5');
        expect($scope.$$childTail.filteredModel[1].name).to.equal('松江2');

        let filterItem = elem.find('div').children().eq(1).children().eq(0);
        let filterItem2 = elem.find('div').children().eq(1).children().eq(1);
        filterItem.triggerHandler('click'); // click first filtered item
        // validate the outputData
        expect($scope.$$childTail.outputData.length).to.equal(1);
        expect($scope.$$childTail.outputData[0].id).to.equal('1');
        expect($scope.$$childTail.outputData[0].name).to.equal('松江');

        // validate the title
        var titleButtons = elem.find('div').eq(1).children('div').eq(0).children('div').eq(2).children();
        expect(titleButtons.length).to.equal(1);
        expect(titleButtons.eq(0).text()).to.equal('x 松江');
        expect(filterItem.attr('class')).to.contain('selected');
        // validate the class of item
        initButton.triggerHandler('click');
        var sjItem = elem.find('div').children().eq(2).children().eq(0);
        expect(sjItem.attr('class')).to.contain('selected');

        // filter by '松江', then change the filtername to '松' and clear the filtername at last
        elem.find('input').val('松江');
        elem.find('input').triggerHandler('input');
        $timeout.flush(2000); // sleep 2s to wait filter
        // $httpBackend.flush();
        expect($scope.$$childTail.filteredModel.length).to.equal(2);
        expect($scope.$$childTail.filteredModel[0].id).to.equal('1');
        expect($scope.$$childTail.filteredModel[0].name).to.equal('松江');
        expect($scope.$$childTail.filteredModel[1].id).to.equal('5');
        expect($scope.$$childTail.filteredModel[1].name).to.equal('松江2');
        elem.find('input').val('松');
        elem.find('input').triggerHandler('input');
        $timeout.flush(2000); // sleep 2s to wait filter
        $httpBackend.flush();
        expect($scope.$$childTail.filteredModel.length).to.equal(3);
        expect($scope.$$childTail.filteredModel[0].id).to.equal('1');
        expect($scope.$$childTail.filteredModel[0].name).to.equal('松江');
        expect($scope.$$childTail.filteredModel[1].id).to.equal('5');
        expect($scope.$$childTail.filteredModel[1].name).to.equal('松江2');
        expect($scope.$$childTail.filteredModel[2].id).to.equal('6');
        expect($scope.$$childTail.filteredModel[2].name).to.equal('松卫北路');
        filterItem = elem.find('div').children().eq(2).children().eq(0);
        filterItem2 = elem.find('div').children().eq(2).children().eq(1);
        let filterItem3 = elem.find('div').children().eq(2).children().eq(2);
        expect(filterItem.attr('name')).to.equal('松江');
        expect(filterItem2.attr('name')).to.equal('松江2');
        expect(filterItem3.attr('name')).to.equal('松卫北路');
        // validate the ticked item in inputmodel
        expect($scope.$$childTail.filteredModel[0].ticked).to.equal(true);
        expect(typeof($scope.$$childTail.filteredModel[1].ticked)).to.equal('undefined');
        expect(typeof($scope.$$childTail.filteredModel[2].ticked)).to.equal('undefined');
        // validate ther button label
        expect(initButton.text()).to.contain('松江');
        // validate the outputData
        var outputData = $scope.$$childTail.outputData;
        expect(outputData.length).to.equal(1);
        expect(outputData[0].id).to.equal('1');
        expect(outputData[0].name).to.equal('松江');
        // validate the page attributes
        expect(filterItem.attr('class')).to.contain('selected');
        expect(filterItem.find('input').attr('checked')).to.equal('checked');
        expect(typeof filterItem.find('span')).not.to.equal('undefined');
        expect(filterItem2.attr('class')).not.to.contain('selected');
        expect(typeof filterItem2.find('input').attr('checked')).to.equal('undefined');
        expect(filterItem3.attr('class')).not.to.contain('selected');
        expect(typeof filterItem3.find('input').attr('checked')).to.equal('undefined');
        // validate the title
        titleButtons = elem.find('div').eq(1).children('div').eq(0).children('div').eq(2).children();
        expect(titleButtons.length).to.equal(1);
        expect(titleButtons.eq(0).text()).to.equal('x 松江');

        filterItem3.triggerHandler('click');
        // validate the ticked item in inputmodel
        expect($scope.$$childTail.filteredModel[0].ticked).to.equal(true);
        expect(typeof($scope.$$childTail.filteredModel[1].ticked)).to.equal('undefined');
        expect($scope.$$childTail.filteredModel[2].ticked).to.equal(true);
        // validate ther button label
        expect(initButton.text()).to.contain('松江, ... 等2项');
        // validate the outputData
        outputData = $scope.$$childTail.outputData;
        expect(outputData.length).to.equal(2);
        expect(outputData[0].id).to.equal('1');
        expect(outputData[1].id).to.equal('6');
        expect(outputData[0].name).to.equal('松江');
        expect(outputData[1].name).to.equal('松卫北路');
        // validate the page attributes
        expect(filterItem.attr('class')).to.contain('selected');
        expect(filterItem.find('input').attr('checked')).to.equal('checked');
        expect(typeof filterItem.find('span')).not.to.equal('undefined');

        expect(filterItem2.attr('class')).not.to.contain('selected');
        expect(typeof filterItem2.find('input').attr('checked')).to.equal('undefined');
        

        expect(filterItem3.attr('class')).to.contain('selected');
        expect(filterItem3.find('input').attr('checked')).to.equal('checked');
        expect(typeof filterItem3.find('span')).not.to.equal('undefined');
        // validate the title
        titleButtons = elem.find('div').eq(1).children('div').eq(0).children('div').eq(2).children();
        expect(titleButtons.length).to.equal(2);
        expect(titleButtons.eq(0).text()).to.equal('x 松江');
        expect(titleButtons.eq(1).text()).to.equal('x 松卫北路');

        filterItem3.triggerHandler('click');

        // validate the ticked item in inputmodel
        expect($scope.$$childTail.filteredModel[0].ticked).to.equal(true);
        expect(typeof($scope.$$childTail.filteredModel[1].ticked)).to.equal('undefined');
        expect($scope.$$childTail.filteredModel[2].ticked).to.equal(false);
        // validate ther button label
        expect(initButton.text()).to.contain('松江');
        // validate the outputData
        outputData = $scope.$$childTail.outputData;
        expect(outputData.length).to.equal(1);
        expect(outputData[0].id).to.equal('1');
        expect(outputData[0].name).to.equal('松江');
        // validate the page attributes
        expect(filterItem.attr('class')).to.contain('selected');
        expect(filterItem.find('input').attr('checked')).to.equal('checked');
        expect(typeof filterItem.find('span')).not.to.equal('undefined');

        expect(filterItem2.attr('class')).not.to.contain('selected');
        expect(typeof filterItem2.find('input').attr('checked')).to.equal('undefined');

        expect(filterItem3.attr('class')).not.to.contain('selected');
        expect(typeof filterItem3.find('input').attr('checked')).to.equal('undefined');

        // validate the title
        titleButtons = elem.find('div').eq(1).children('div').eq(0).children('div').eq(2).children();
        expect(titleButtons.length).to.equal(1);
        expect(titleButtons.eq(0).text()).to.equal('x 松江');
    });

    it('#9 it should be ok filtered after 2s in single mode', function() {
        $httpBackend.whenPOST('/multiselector/test/').respond(function(method, url, rData, headers) {
            var data = {};
            rData = JSON.parse(rData);
            if (rData.flag === 'init') {
                data = {
                    status: 'success',
                    message: false,
                    data: {
                        filterRecord: [
                            { id: '1', name: '松江' },
                            { id: '2', name: '徐汇' },
                            { id: '3', name: '闵行' },
                            { id: '4', name: '浦东' }
                        ]
                    }
                };
            } else if(rData.flag === 'filter') {
                if (rData.filterName === '松江') {
                    data = {
                        status: 'success',
                        message: false,
                        data: {
                            filterRecord: [
                                { id: '1', name: '松江' },
                                { id: '5', name: '松江2' }
                            ]
                        }
                    };
                } else if(rData.filterName === '松') {
                    data = {
                        status: 'success',
                        message: false,
                        data: {
                            filterRecord: [
                                { id: '1', name: '松江' },
                                { id: '5', name: '松江2' },
                                { id: '6', name: '松卫北路' }
                            ]
                        }
                    };
                } else {
                    data = {
                        status: 'success',
                        message: false,
                        data: {
                            filterRecord: [
                                { id: '1', name: '松江' },
                                { id: '2', name: '徐汇' },
                                { id: '3', name: '闵行' },
                                { id: '4', name: '浦东' }
                            ]
                        }
                    };
                }
            }
            return [200, data, {}];
        });
        template = angular.element('<div isteven-multi-select output-data="selectedTestIds" filter-url="/multiselector/test/" item-label="name" button-label="name" selector-id="testSelector" selection-mode="single">');
        elem = compile(template)($scope);
        $scope.$digest();
        $scope.selectedTestIds = [];
        expect(elem.attr('filter-url')).to.equal($scope.$$childTail.filterUrl);
        expect(elem.attr('selector-id')).to.equal($scope.$$childTail.selectorId);
        let initButton = angular.element(elem.find('button')[0]);
        initButton.triggerHandler('click');
        $httpBackend.flush();

        inputModel = $scope.$$childTail.inputModel;
        expect(inputModel[0].id).to.equal('1');
        expect(inputModel[1].id).to.equal('2');
        expect(inputModel[2].id).to.equal('3');
        expect(inputModel[3].id).to.equal('4');
        expect(inputModel[0].name).to.equal('松江');
        expect(inputModel[1].name).to.equal('徐汇');
        expect(inputModel[2].name).to.equal('闵行');
        expect(inputModel[3].name).to.equal('浦东');

        elem.find('input').val('松江');
        elem.find('input').triggerHandler('input');
        $timeout.flush(2000); // sleep 2s to wait filter
        $httpBackend.flush();
        expect($scope.$$childTail.filteredModel.length).to.equal(2);
        expect($scope.$$childTail.filteredModel[0].id).to.equal('1');
        expect($scope.$$childTail.filteredModel[0].name).to.equal('松江');
        expect($scope.$$childTail.filteredModel[1].id).to.equal('5');
        expect($scope.$$childTail.filteredModel[1].name).to.equal('松江2');

        let filterItem = elem.find('div').children().eq(1).children().eq(0);
        let filterItem2 = elem.find('div').children().eq(1).children().eq(1);
        filterItem.triggerHandler('click'); // click first filtered item
        // validate the outputData
        expect($scope.$$childTail.outputData.length).to.equal(1);
        expect($scope.$$childTail.outputData[0].id).to.equal('1');
        expect($scope.$$childTail.outputData[0].name).to.equal('松江');

        // validate the title
        var titleButtons = elem.find('div').eq(1).children('div').eq(0).children('div').eq(2).children();
        expect(titleButtons.length).to.equal(1);
        expect(titleButtons.eq(0).text()).to.equal('x 松江');
        expect(filterItem.attr('class')).to.contain('selected');
        // validate the class of item
        initButton.triggerHandler('click');
        var sjItem = elem.find('div').children().eq(2).children().eq(0);
        expect(sjItem.attr('class')).to.contain('selected');

        filterItem.triggerHandler('click');

        // filter by '松江', then change the filtername to '松' and clear the filtername at last
        expect($scope.$$childTail.filteredModel.length).to.equal(5);
        expect($scope.$$childTail.filteredModel[0].id).to.equal('1');
        expect($scope.$$childTail.filteredModel[1].id).to.equal('2');
        expect($scope.$$childTail.filteredModel[2].id).to.equal('3');
        expect($scope.$$childTail.filteredModel[3].id).to.equal('4');
        expect($scope.$$childTail.filteredModel[4].id).to.equal('5');
        expect($scope.$$childTail.filteredModel[0].name).to.equal('松江');
        expect($scope.$$childTail.filteredModel[1].name).to.equal('徐汇');
        expect($scope.$$childTail.filteredModel[2].name).to.equal('闵行');
        expect($scope.$$childTail.filteredModel[3].name).to.equal('浦东');
        expect($scope.$$childTail.filteredModel[4].name).to.equal('松江2');

        elem.find('input').val('松');
        elem.find('input').triggerHandler('input');
        $timeout.flush(2000); // sleep 2s to wait filter
        $httpBackend.flush();
        expect($scope.$$childTail.filteredModel.length).to.equal(3);
        expect($scope.$$childTail.filteredModel[0].id).to.equal('1');
        expect($scope.$$childTail.filteredModel[0].name).to.equal('松江');
        expect($scope.$$childTail.filteredModel[1].id).to.equal('5');
        expect($scope.$$childTail.filteredModel[1].name).to.equal('松江2');
        expect($scope.$$childTail.filteredModel[2].id).to.equal('6');
        expect($scope.$$childTail.filteredModel[2].name).to.equal('松卫北路');
        filterItem = elem.find('div').children().eq(2).children().eq(0);
        filterItem2 = elem.find('div').children().eq(2).children().eq(1);
        let filterItem3 = elem.find('div').children().eq(2).children().eq(2);
        expect(filterItem.attr('name')).to.equal('松江');
        expect(filterItem2.attr('name')).to.equal('松江2');
        expect(filterItem3.attr('name')).to.equal('松卫北路');
        // validate the ticked item in inputmodel
        expect($scope.$$childTail.filteredModel[0].ticked).to.equal(true);
        expect(typeof($scope.$$childTail.filteredModel[1].ticked)).to.equal('undefined');
        expect(typeof($scope.$$childTail.filteredModel[2].ticked)).to.equal('undefined');
        // validate ther button label
        expect(initButton.text()).to.contain('松江');
        // validate the outputData
        var outputData = $scope.$$childTail.outputData;
        expect(outputData.length).to.equal(1);
        expect(outputData[0].id).to.equal('1');
        expect(outputData[0].name).to.equal('松江');
        // validate the page attributes
        expect(filterItem.attr('class')).to.contain('selected');
        expect(filterItem.find('input').attr('checked')).to.equal('checked');
        expect(typeof filterItem.find('span')).not.to.equal('undefined');
        expect(filterItem2.attr('class')).not.to.contain('selected');
        expect(typeof filterItem2.find('input').attr('checked')).to.equal('undefined');
        expect(filterItem3.attr('class')).not.to.contain('selected');
        expect(typeof filterItem3.find('input').attr('checked')).to.equal('undefined');
        // validate the title
        titleButtons = elem.find('div').eq(1).children('div').eq(0).children('div').eq(2).children();
        expect(titleButtons.length).to.equal(1);
        expect(titleButtons.eq(0).text()).to.equal('x 松江');

        filterItem3.triggerHandler('click');
        // validate the ticked item in inputmodel
        expect($scope.$$childTail.filteredModel[0].ticked).to.equal(false);
        expect($scope.$$childTail.filteredModel[1].ticked).to.equal(false);
        expect($scope.$$childTail.filteredModel[2].ticked).to.equal(true);
        // validate ther button label
        expect(initButton.text()).to.contain('松卫北路');
        // validate the outputData
        outputData = $scope.$$childTail.outputData;
        expect(outputData.length).to.equal(1);
        expect(outputData[0].id).to.equal('6');
        expect(outputData[0].name).to.equal('松卫北路');
        // validate the page attributes
        expect(filterItem.attr('class')).not.to.contain('selected');
        expect(typeof filterItem.find('input').attr('checked')).to.equal('undefined');

        expect(filterItem2.attr('class')).not.to.contain('selected');
        expect(typeof filterItem2.find('input').attr('checked')).to.equal('undefined');
        

        expect(filterItem3.attr('class')).to.contain('selected');
        expect(filterItem3.find('input').attr('checked')).to.equal('checked');
        expect(typeof filterItem3.find('span')).not.to.equal('undefined');
        // validate the title
        titleButtons = elem.find('div').eq(1).children('div').eq(0).children('div').eq(2).children();
        expect(titleButtons.length).to.equal(1);
        expect(titleButtons.eq(0).text()).to.equal('x 松卫北路');
    });

    it('#10 test selectall, selectnone, reset when init-data was setted in multi mode', function() {
        $httpBackend.expect('POST', '/admin/multiselector/intitdata').respond({
            status: "success",
            message: false,
            data: {
                filterRecord: [
                    { id: '1', name: '松江' }
                ]
            }
        });
        $httpBackend.expect('POST', '/multiselector/test/').respond({
            status: "success",
            message: false,
            data: {
                filterRecord: [
                    { id: '1', name: '松江' },
                    { id: '2', name: '徐汇' },
                    { id: '3', name: '闵行' },
                    { id: '4', name: '浦东' }
                ]
            }
        });
        $scope.testInitData = '1';
        template = angular.element('<div isteven-multi-select output-data="selectedTestIds" filter-url="/multiselector/test/" item-label="name" button-label="name" selector-id="testSelector" init-data="testInitData">');
        elem = compile(template)($scope);
        $scope.$digest();
        $scope.selectedTestIds = [];
        expect(angular.element(elem[0]).attr('filter-url')).to.equal($scope.$$childTail.filterUrl);
        let selectorId = angular.element(elem[0]).attr('selector-id');
        expect(selectorId).to.equal($scope.$$childTail.selectorId);
        // inputModel is empty before click the selector
        expect($scope.$$childTail.inputModel.length).to.equal(0);
        expect(typeof($scope.$$childTail.outputData)).to.equal('undefined');

        let initButton = angular.element(elem.find('button')[0]);
        initButton.triggerHandler('click');
        $httpBackend.flush();
        expect($scope.$$childTail.outputData.length).to.equal(1);
        expect($scope.$$childTail.outputData[0].id).to.equal('1');
        expect($scope.$$childTail.outputData[0].name).to.equal('松江');

        // validate the inputmodel
        var inputModel = $scope.$$childTail.inputModel;
        expect(inputModel[0].id).to.equal('1');
        expect(inputModel[1].id).to.equal('2');
        expect(inputModel[2].id).to.equal('3');
        expect(inputModel[3].id).to.equal('4');
        expect(inputModel[0].name).to.equal('松江');
        expect(inputModel[1].name).to.equal('徐汇');
        expect(inputModel[2].name).to.equal('闵行');
        expect(inputModel[3].name).to.equal('浦东');
        expect(inputModel[0].ticked).to.equal(true);
        expect(typeof(inputModel[1].ticked)).to.equal('undefined');
        expect(typeof(inputModel[2].ticked)).to.equal('undefined');
        expect(typeof(inputModel[3].ticked)).to.equal('undefined');

        let sjItem = elem.find('div').children().eq(2).children().eq(0);
        let xhItem = elem.find('div').children().eq(2).children().eq(1);
        let mhItem = elem.find('div').children().eq(2).children().eq(2);
        let pdItem = elem.find('div').children().eq(2).children().eq(3);
        // validate the outputData
        let outputData = $scope.$$childTail.outputData;
        expect(outputData.length).to.equal(1);
        expect(outputData[0].id).to.equal('1');
        expect(outputData[0].name).to.equal('松江');

        // validate the title
        var titleButtons = elem.find('div').eq(1).children('div').eq(0).children('div').eq(2).children();
        expect(titleButtons.length).to.equal(1);
        expect(titleButtons.eq(0).text()).to.equal('x 松江');
        // validate the class of item
        expect(sjItem.attr('class')).to.contain('selected');
        expect(sjItem.find('input').attr('checked')).to.equal('checked');
        expect(typeof sjItem.find('span')).not.to.equal('undefined');

        expect(xhItem.attr('class')).not.to.contain('selected');
        expect(typeof xhItem.find('input').attr('checked')).to.equal('undefined');

        expect(mhItem.attr('class')).not.to.contain('selected');
        expect(typeof mhItem.find('input').attr('checked')).to.equal('undefined');

        expect(pdItem.attr('class')).not.to.contain('selected');
        expect(typeof pdItem.find('input').attr('checked')).to.equal('undefined');

        // validate ther button label
        expect(initButton.text()).to.contain('松江');
        expect(initButton.text()).not.to.contain('徐汇');
        expect(initButton.text()).not.to.contain('闵行');
        expect(initButton.text()).not.to.contain('浦东');

        /*click '松江' and '徐汇'*/
        sjItem.triggerHandler('click');
        xhItem.triggerHandler('click');

        // validate the outputData
        outputData = $scope.$$childTail.outputData;
        expect(outputData.length).to.equal(1);
        expect(outputData[0].id).to.equal('2');
        expect(outputData[0].name).to.equal('徐汇');

        // validate the title
        titleButtons = elem.find('div').eq(1).children('div').eq(0).children('div').eq(2).children();
        expect(titleButtons.length).to.equal(1);
        expect(titleButtons.eq(0).text()).to.equal('x 徐汇');
        // validate the class of item
        expect(sjItem.attr('class')).not.to.contain('selected');
        expect(typeof sjItem.find('input').attr('checked')).to.equal('undefined');

        expect(xhItem.attr('class')).to.contain('selected');
        expect(xhItem.find('input').attr('checked')).to.equal('checked');
        expect(typeof xhItem.find('span')).not.to.equal('undefined');

        expect(mhItem.attr('class')).not.to.contain('selected');
        expect(typeof mhItem.find('input').attr('checked')).to.equal('undefined');

        expect(pdItem.attr('class')).not.to.contain('selected');
        expect(typeof pdItem.find('input').attr('checked')).to.equal('undefined');

        // validate ther button label
        expect(initButton.text()).not.to.contain('松江');
        expect(initButton.text()).to.contain('徐汇');
        expect(initButton.text()).not.to.contain('闵行');
        expect(initButton.text()).not.to.contain('浦东');

        // validate inputModel
        expect(inputModel[0].id).to.equal('1');
        expect(inputModel[1].id).to.equal('2');
        expect(inputModel[2].id).to.equal('3');
        expect(inputModel[3].id).to.equal('4');
        expect(inputModel[0].name).to.equal('松江');
        expect(inputModel[1].name).to.equal('徐汇');
        expect(inputModel[2].name).to.equal('闵行');
        expect(inputModel[3].name).to.equal('浦东');
        expect(inputModel[0].ticked).to.equal(false);
        expect(inputModel[1].ticked).to.equal(true);
        expect(typeof(inputModel[2].ticked)).to.equal('undefined');
        expect(typeof(inputModel[3].ticked)).to.equal('undefined');

        /*select all*/
        let selectAll = elem.find('div').children().eq(1).children().eq(0).children().eq(0);
        selectAll.triggerHandler('click');

        // validate the outputData
        outputData = $scope.$$childTail.outputData;
        expect(outputData.length).to.equal(4);
        expect(outputData[0].id).to.equal('1');
        expect(outputData[0].name).to.equal('松江');
        expect(outputData[1].id).to.equal('2');
        expect(outputData[1].name).to.equal('徐汇');
        expect(outputData[2].id).to.equal('3');
        expect(outputData[2].name).to.equal('闵行');
        expect(outputData[3].id).to.equal('4');
        expect(outputData[3].name).to.equal('浦东');

        // validate the title
        titleButtons = elem.find('div').eq(1).children('div').eq(0).children('div').eq(2).children();
        expect(titleButtons.length).to.equal(4);
        expect(titleButtons.eq(0).text()).to.equal('x 松江');
        expect(titleButtons.eq(1).text()).to.equal('x 徐汇');
        expect(titleButtons.eq(2).text()).to.equal('x 闵行');
        expect(titleButtons.eq(3).text()).to.equal('x 浦东');
        // validate the class of item
        expect(sjItem.attr('class')).to.contain('selected');
        expect(sjItem.find('input').attr('checked')).to.equal('checked');
        expect(typeof sjItem.find('span')).not.to.equal('undefined');

        expect(xhItem.attr('class')).to.contain('selected');
        expect(xhItem.find('input').attr('checked')).to.equal('checked');
        expect(typeof xhItem.find('span')).not.to.equal('undefined');

        expect(mhItem.attr('class')).to.contain('selected');
        expect(mhItem.find('input').attr('checked')).to.equal('checked');
        expect(typeof mhItem.find('span')).not.to.equal('undefined');

        expect(pdItem.attr('class')).to.contain('selected');
        expect(pdItem.find('input').attr('checked')).to.equal('checked');
        expect(typeof pdItem.find('span')).not.to.equal('undefined');

        // validate ther button label
        expect(initButton.text()).to.contain('松江, ... 等4项');

        // validate inputModel
        expect(inputModel[0].id).to.equal('1');
        expect(inputModel[1].id).to.equal('2');
        expect(inputModel[2].id).to.equal('3');
        expect(inputModel[3].id).to.equal('4');
        expect(inputModel[0].name).to.equal('松江');
        expect(inputModel[1].name).to.equal('徐汇');
        expect(inputModel[2].name).to.equal('闵行');
        expect(inputModel[3].name).to.equal('浦东');
        expect(inputModel[0].ticked).to.equal(true);
        expect(inputModel[1].ticked).to.equal(true);
        expect(inputModel[2].ticked).to.equal(true);
        expect(inputModel[3].ticked).to.equal(true);

        /*select none*/
        let selectNone = elem.find('div').children().eq(1).children().eq(0).children().eq(1);
        selectNone.triggerHandler('click');

        // validate the outputData
        outputData = $scope.$$childTail.outputData;
        expect(outputData.length).to.equal(0);

        // validate the title
        titleButtons = elem.find('div').eq(1).children('div').eq(0).children('div').eq(2).children();
        expect(titleButtons.length).to.equal(0);
        // validate the class of item
        expect(sjItem.attr('class')).not.to.contain('selected');
        expect(typeof sjItem.find('input').attr('checked')).to.equal('undefined');

        expect(xhItem.attr('class')).not.to.contain('selected');
        expect(typeof xhItem.find('input').attr('checked')).to.equal('undefined');

        expect(mhItem.attr('class')).not.to.contain('selected');
        expect(typeof mhItem.find('input').attr('checked')).to.equal('undefined');

        expect(pdItem.attr('class')).not.to.contain('selected');
        expect(typeof pdItem.find('input').attr('checked')).to.equal('undefined');

        // validate ther button label
        expect(initButton.text()).to.equal('');

        // validate inputModel
        expect(inputModel[0].id).to.equal('1');
        expect(inputModel[1].id).to.equal('2');
        expect(inputModel[2].id).to.equal('3');
        expect(inputModel[3].id).to.equal('4');
        expect(inputModel[0].name).to.equal('松江');
        expect(inputModel[1].name).to.equal('徐汇');
        expect(inputModel[2].name).to.equal('闵行');
        expect(inputModel[3].name).to.equal('浦东');
        expect(inputModel[0].ticked).to.equal(false);
        expect(inputModel[1].ticked).to.equal(false);
        expect(inputModel[2].ticked).to.equal(false);
        expect(inputModel[3].ticked).to.equal(false);

        /*reset*/
        /*var reset = elem.find('div').children().eq(0).children().eq(0).children().eq(2);
        reset.triggerHandler('click');
        // $httpBackend.flush();

        // validate the outputData
        outputData = $scope.$$childTail.outputData;
        console.log(outputData);
        expect(outputData.length).to.equal(1);
        expect(outputData[0].id).to.equal('1');
        expect(outputData[0].name).to.equal('松江');

        // validate the title
        titleButtons = elem.find('div').eq(1).children('div').eq(0).children('div').eq(2).children();
        expect(titleButtons.length).to.equal(1);
        expect(titleButtons.eq(0).text()).to.equal('x 松江');
        // validate the class of item
        expect(sjItem.attr('class')).to.contain('selected');
        expect(sjItem.find('input').attr('checked')).to.equal('checked');
        expect(typeof sjItem.find('span')).not.to.equal('undefined');

        expect(xhItem.attr('class')).not.to.contain('selected');
        expect(typeof xhItem.find('input').attr('checked')).to.equal('undefined');

        expect(mhItem.attr('class')).not.to.contain('selected');
        expect(typeof mhItem.find('input').attr('checked')).to.equal('undefined');

        expect(pdItem.attr('class')).not.to.contain('selected');
        expect(typeof pdItem.find('input').attr('checked')).to.equal('undefined');

        // validate ther button label
        expect(initButton.text()).to.contain('松江');
        expect(initButton.text()).not.to.contain('徐汇');
        expect(initButton.text()).not.to.contain('闵行');
        expect(initButton.text()).not.to.contain('浦东');*/
    });

    xit('#11 test selectall, selectnone, reset when init-data was not setted in multi mode', function() {
        $httpBackend.expect('POST', '/admin/multiselector/intitdata').respond({
            status: "success",
            message: false,
            data: {
                filterRecord: [
                    { id: '1', name: '松江' }
                ]
            }
        });
        $httpBackend.expect('POST', '/multiselector/test/').respond({
            status: "success",
            message: false,
            data: {
                filterRecord: [
                    { id: '1', name: '松江' },
                    { id: '2', name: '徐汇' },
                    { id: '3', name: '闵行' },
                    { id: '4', name: '浦东' }
                ]
            }
        });
        template = angular.element('<div isteven-multi-select output-data="selectedTestIds" filter-url="/multiselector/test/" item-label="name" button-label="name" selector-id="testSelector">');
        elem = compile(template)($scope);
        $scope.$digest();
        $scope.selectedTestIds = [];
        expect(angular.element(elem[0]).attr('filter-url')).to.equal($scope.$$childTail.filterUrl);
        let selectorId = angular.element(elem[0]).attr('selector-id');
        expect(selectorId).to.equal($scope.$$childTail.selectorId);
        // inputModel is empty before click the selector
        expect($scope.$$childTail.inputModel.length).to.equal(0);
        expect(typeof($scope.$$childTail.outputData)).to.equal('undefined');

        let initButton = angular.element(elem.find('button')[0]);
        initButton.triggerHandler('click');
        $httpBackend.flush();
        expect($scope.$$childTail.outputData.length).to.equal(1);
        expect($scope.$$childTail.outputData[0].id).to.equal('1');
        expect($scope.$$childTail.outputData[0].name).to.equal('松江');

        // validate the inputmodel
        var inputModel = $scope.$$childTail.inputModel;
        expect(inputModel[0].id).to.equal('1');
        expect(inputModel[1].id).to.equal('2');
        expect(inputModel[2].id).to.equal('3');
        expect(inputModel[3].id).to.equal('4');
        expect(inputModel[0].name).to.equal('松江');
        expect(inputModel[1].name).to.equal('徐汇');
        expect(inputModel[2].name).to.equal('闵行');
        expect(inputModel[3].name).to.equal('浦东');
        expect(typeof(inputModel[0].ticked)).to.equal('undefined');
        expect(typeof(inputModel[1].ticked)).to.equal('undefined');
        expect(typeof(inputModel[2].ticked)).to.equal('undefined');
        expect(typeof(inputModel[3].ticked)).to.equal('undefined');

        let sjItem = elem.find('div').children().eq(1).children().eq(0);
        let xhItem = elem.find('div').children().eq(1).children().eq(1);
        let mhItem = elem.find('div').children().eq(1).children().eq(2);
        let pdItem = elem.find('div').children().eq(1).children().eq(3);
        // validate the outputData
        let outputData = $scope.$$childTail.outputData;
        expect(outputData.length).to.equal(0);

        // validate the title
        var titleButtons = elem.find('div').eq(1).children('div').eq(0).children('div').eq(2).children();
        expect(titleButtons.length).to.equal(1);
        expect(titleButtons.eq(0).text()).to.equal('x 松江');
        // validate the class of item
        expect(sjItem.attr('class')).to.contain('selected');
        expect(sjItem.find('input').attr('checked')).to.equal('checked');
        expect(typeof sjItem.find('span')).not.to.equal('undefined');

        expect(xhItem.attr('class')).not.to.contain('selected');
        expect(typeof xhItem.find('input').attr('checked')).to.equal('undefined');

        expect(mhItem.attr('class')).not.to.contain('selected');
        expect(typeof mhItem.find('input').attr('checked')).to.equal('undefined');

        expect(pdItem.attr('class')).not.to.contain('selected');
        expect(typeof pdItem.find('input').attr('checked')).to.equal('undefined');

        // validate ther button label
        expect(initButton.text()).to.contain('松江');
        expect(initButton.text()).not.to.contain('徐汇');
        expect(initButton.text()).not.to.contain('闵行');
        expect(initButton.text()).not.to.contain('浦东');

        /*click '松江' and '徐汇'*/
        sjItem.triggerHandler('click');
        xhItem.triggerHandler('click');

        // validate the outputData
        outputData = $scope.$$childTail.outputData;
        expect(outputData.length).to.equal(1);
        expect(outputData[0].id).to.equal('2');
        expect(outputData[0].name).to.equal('徐汇');

        // validate the title
        titleButtons = elem.find('div').eq(1).children('div').eq(0).children('div').eq(2).children();
        expect(titleButtons.length).to.equal(1);
        expect(titleButtons.eq(0).text()).to.equal('x 徐汇');
        // validate the class of item
        expect(sjItem.attr('class')).not.to.contain('selected');
        expect(typeof sjItem.find('input').attr('checked')).to.equal('undefined');

        expect(xhItem.attr('class')).to.contain('selected');
        expect(xhItem.find('input').attr('checked')).to.equal('checked');
        expect(typeof xhItem.find('span')).not.to.equal('undefined');

        expect(mhItem.attr('class')).not.to.contain('selected');
        expect(typeof mhItem.find('input').attr('checked')).to.equal('undefined');

        expect(pdItem.attr('class')).not.to.contain('selected');
        expect(typeof pdItem.find('input').attr('checked')).to.equal('undefined');

        // validate ther button label
        expect(initButton.text()).not.to.contain('松江');
        expect(initButton.text()).to.contain('徐汇');
        expect(initButton.text()).not.to.contain('闵行');
        expect(initButton.text()).not.to.contain('浦东');

        // validate inputModel
        expect(inputModel[0].id).to.equal('1');
        expect(inputModel[1].id).to.equal('2');
        expect(inputModel[2].id).to.equal('3');
        expect(inputModel[3].id).to.equal('4');
        expect(inputModel[0].name).to.equal('松江');
        expect(inputModel[1].name).to.equal('徐汇');
        expect(inputModel[2].name).to.equal('闵行');
        expect(inputModel[3].name).to.equal('浦东');
        expect(inputModel[0].ticked).to.equal(false);
        expect(inputModel[1].ticked).to.equal(true);
        expect(typeof(inputModel[2].ticked)).to.equal('undefined');
        expect(typeof(inputModel[3].ticked)).to.equal('undefined');

        /*select all*/
        let selectAll = elem.find('div').children().eq(1).children().eq(0).children().eq(0);
        selectAll.triggerHandler('click');

        // validate the outputData
        outputData = $scope.$$childTail.outputData;
        expect(outputData.length).to.equal(4);
        expect(outputData[0].id).to.equal('1');
        expect(outputData[0].name).to.equal('松江');
        expect(outputData[1].id).to.equal('2');
        expect(outputData[1].name).to.equal('徐汇');
        expect(outputData[2].id).to.equal('3');
        expect(outputData[2].name).to.equal('闵行');
        expect(outputData[3].id).to.equal('4');
        expect(outputData[3].name).to.equal('浦东');

        // validate the title
        titleButtons = elem.find('div').eq(1).children('div').eq(0).children('div').eq(2).children();
        expect(titleButtons.length).to.equal(4);
        expect(titleButtons.eq(0).text()).to.equal('x 松江');
        expect(titleButtons.eq(1).text()).to.equal('x 徐汇');
        expect(titleButtons.eq(2).text()).to.equal('x 闵行');
        expect(titleButtons.eq(3).text()).to.equal('x 浦东');
        // validate the class of item
        expect(sjItem.attr('class')).to.contain('selected');
        expect(sjItem.find('input').attr('checked')).to.equal('checked');
        expect(typeof sjItem.find('span')).not.to.equal('undefined');

        expect(xhItem.attr('class')).to.contain('selected');
        expect(xhItem.find('input').attr('checked')).to.equal('checked');
        expect(typeof xhItem.find('span')).not.to.equal('undefined');

        expect(mhItem.attr('class')).to.contain('selected');
        expect(mhItem.find('input').attr('checked')).to.equal('checked');
        expect(typeof mhItem.find('span')).not.to.equal('undefined');

        expect(pdItem.attr('class')).to.contain('selected');
        expect(pdItem.find('input').attr('checked')).to.equal('checked');
        expect(typeof pdItem.find('span')).not.to.equal('undefined');

        // validate ther button label
        expect(initButton.text()).to.contain('松江, ... 等4项');

        // validate inputModel
        expect(inputModel[0].id).to.equal('1');
        expect(inputModel[1].id).to.equal('2');
        expect(inputModel[2].id).to.equal('3');
        expect(inputModel[3].id).to.equal('4');
        expect(inputModel[0].name).to.equal('松江');
        expect(inputModel[1].name).to.equal('徐汇');
        expect(inputModel[2].name).to.equal('闵行');
        expect(inputModel[3].name).to.equal('浦东');
        expect(inputModel[0].ticked).to.equal(true);
        expect(inputModel[1].ticked).to.equal(true);
        expect(inputModel[2].ticked).to.equal(true);
        expect(inputModel[3].ticked).to.equal(true);

        /*select none*/
        let selectNone = elem.find('div').children().eq(1).children().eq(0).children().eq(1);
        selectNone.triggerHandler('click');

        // validate the outputData
        outputData = $scope.$$childTail.outputData;
        expect(outputData.length).to.equal(0);

        // validate the title
        titleButtons = elem.find('div').eq(1).children('div').eq(0).children('div').eq(2).children();
        expect(titleButtons.length).to.equal(0);
        // validate the class of item
        expect(sjItem.attr('class')).not.to.contain('selected');
        expect(typeof sjItem.find('input').attr('checked')).to.equal('undefined');

        expect(xhItem.attr('class')).not.to.contain('selected');
        expect(typeof xhItem.find('input').attr('checked')).to.equal('undefined');

        expect(mhItem.attr('class')).not.to.contain('selected');
        expect(typeof mhItem.find('input').attr('checked')).to.equal('undefined');

        expect(pdItem.attr('class')).not.to.contain('selected');
        expect(typeof pdItem.find('input').attr('checked')).to.equal('undefined');

        // validate ther button label
        expect(initButton.text()).to.equal('');

        // validate inputModel
        expect(inputModel[0].id).to.equal('1');
        expect(inputModel[1].id).to.equal('2');
        expect(inputModel[2].id).to.equal('3');
        expect(inputModel[3].id).to.equal('4');
        expect(inputModel[0].name).to.equal('松江');
        expect(inputModel[1].name).to.equal('徐汇');
        expect(inputModel[2].name).to.equal('闵行');
        expect(inputModel[3].name).to.equal('浦东');
        expect(inputModel[0].ticked).to.equal(false);
        expect(inputModel[1].ticked).to.equal(false);
        expect(inputModel[2].ticked).to.equal(false);
        expect(inputModel[3].ticked).to.equal(false);

        /*reset*/
        /*var reset = elem.find('div').children().eq(0).children().eq(0).children().eq(2);
        reset.triggerHandler('click');
        // $httpBackend.flush();

        // validate the outputData
        outputData = $scope.$$childTail.outputData;
        console.log(outputData);
        expect(outputData.length).to.equal(1);
        expect(outputData[0].id).to.equal('1');
        expect(outputData[0].name).to.equal('松江');

        // validate the title
        titleButtons = elem.find('div').eq(1).children('div').eq(0).children('div').eq(2).children();
        expect(titleButtons.length).to.equal(1);
        expect(titleButtons.eq(0).text()).to.equal('x 松江');
        // validate the class of item
        expect(sjItem.attr('class')).to.contain('selected');
        expect(sjItem.find('input').attr('checked')).to.equal('checked');
        expect(typeof sjItem.find('span')).not.to.equal('undefined');

        expect(xhItem.attr('class')).not.to.contain('selected');
        expect(typeof xhItem.find('input').attr('checked')).to.equal('undefined');

        expect(mhItem.attr('class')).not.to.contain('selected');
        expect(typeof mhItem.find('input').attr('checked')).to.equal('undefined');

        expect(pdItem.attr('class')).not.to.contain('selected');
        expect(typeof pdItem.find('input').attr('checked')).to.equal('undefined');

        // validate ther button label
        expect(initButton.text()).to.contain('松江');
        expect(initButton.text()).not.to.contain('徐汇');
        expect(initButton.text()).not.to.contain('闵行');
        expect(initButton.text()).not.to.contain('浦东');*/
    });

    it('#12 loadmore should not run, when amount of items is 19', function() {
        $httpBackend.whenPOST('/multiselector/test/').respond(function(method, url, rData, headers) {
            var data = {};
            rData = JSON.parse(rData);
            var filterRecords = [];
            if (rData.flag === 'init') {
                for(let i = 1; i< 20; i++) {
                    filterRecords.push({
                        id: i + '',
                        name: i + ''
                    });
                }
                data = {
                    status: 'success',
                    message: false,
                    data: {
                        filterRecord: filterRecords
                    }
                };
            } else if(rData.flag === 'scoller') {
                for(let i = 21; i< 41; i++) {
                    filterRecords.push({
                        id: i + '',
                        name: i + ''
                    });
                }
                data = {
                    status: 'success',
                    message: false,
                    data: {
                        filterRecord: filterRecords
                    }
                };
            }
            return [200, data, {}];
        });
        template = angular.element('<div isteven-multi-select output-data="selectedTestIds" filter-url="/multiselector/test/" item-label="name" button-label="name" selector-id="testSelector">');
        elem = compile(template)($scope);
        $scope.$digest();
        $scope.selectedTestIds = [];
        expect(elem.attr('filter-url')).to.equal($scope.$$childTail.filterUrl);
        expect(elem.attr('selector-id')).to.equal($scope.$$childTail.selectorId);
        let initButton = angular.element(elem.find('button')[0]);
        initButton.triggerHandler('click');
        $httpBackend.flush();

        var filteredModel = $scope.$$childTail.filteredModel;
        expect(typeof(filteredModel)).to.equal('object');
        expect(filteredModel.length).to.equal(19);
        var lastItem = elem.find('div').children().eq(1).children().eq(18);
        window.scrollTo(0, lastItem);
        $timeout.flush(1000); // sleep 1s to wait load more data
        filteredModel = $scope.$$childTail.filteredModel;
        expect(typeof(filteredModel)).to.equal('object');
        expect(filteredModel.length).to.equal(19);
    });

    it('#13 loadmore should not run, when amount of items is larger than 19', function() {
        $httpBackend.whenPOST('/multiselector/test/').respond(function(method, url, rData, headers) {
            var data = {};
            rData = JSON.parse(rData);
            var filterRecords = [];
            if (rData.flag === 'init') {
                for(let i = 1; i< 21; i++) {
                    filterRecords.push({
                        id: i + '',
                        name: i + ''
                    });
                }
                data = {
                    status: 'success',
                    message: false,
                    data: {
                        filterRecord: filterRecords
                    }
                };
            } else if(rData.flag === 'scoller') {
                for(let i = 21; i< 26; i++) {
                    filterRecords.push({
                        id: i + '',
                        name: i + ''
                    });
                }
                data = {
                    status: 'success',
                    message: false,
                    data: {
                        filterRecord: filterRecords
                    }
                };
            }
            return [200, data, {}];
        });
        template = angular.element('<div isteven-multi-select output-data="selectedTestIds" filter-url="/multiselector/test/" item-label="name" button-label="name" selector-id="testSelector" name="testSelector">');
        elem = compile(template)($scope);
        $scope.$digest();
        $scope.selectedTestIds = [];
        expect(elem.attr('filter-url')).to.equal($scope.$$childTail.filterUrl);
        expect(elem.attr('selector-id')).to.equal($scope.$$childTail.selectorId);
        let initButton = angular.element(elem.find('button')[0]);
        initButton.triggerHandler('click');
        $httpBackend.flush();

        var filteredModel = $scope.$$childTail.filteredModel;
        expect(typeof(filteredModel)).to.equal('object');
        expect(filteredModel.length).to.equal(20);
        var loadMore = elem.find('div').children().eq(1).children().eq(20);
        window.scroll(0, document.body.scrollHeight+10);

        $httpBackend.whenPOST('/multiselector/test/', null, {fromIndex: 20, flag: 'scoller'}).respond(function(method, url, rData, headers) {
            var data = {};
            rData = JSON.parse(rData);
            var filterRecords = [];
            for(let i = 21; i< 26; i++) {
                filterRecords.push({
                    id: i + '',
                    name: i + ''
                });
            }
            data = {
                status: 'success',
                message: false,
                data: {
                    filterRecord: filterRecords
                }
            };
            return [200, data, {}];
        });

        // $timeout.flush(2000); // sleep 1s to wait load more data
        $httpBackend.flush();
        filteredModel = $scope.$$childTail.filteredModel;
        expect(typeof(filteredModel)).to.equal('object');
        expect(filteredModel.length).to.equal(25);
    });
});
//当页面页面上同时出现两个multiSelect时,验证其是否冲突
