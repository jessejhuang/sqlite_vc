/*
 * Root file that handles instances of all the charts and loads the visualization
 */
(function(){
    /**
     * Creates instances for every chart (classes created to handle each chart);
     * the classes are defined in the respective javascript files.
     */
    //Prep materialize
    $( document ).ready(function() {
        M.AutoInit();
        
    });
    
    
    
    let instance = null;

    function networkUpdate(data){
        data = JSON.parse(data);
        let graph = {};
        let yearMin = data.yearMin;
        let yearMax = data.yearMax;
        let type = data.type;
        let cities = data.cities;
        let f_instance = M.FormSelect.getInstance($('#fundingType'));
        let c_instance = M.FormSelect.getInstance($('#categories'));
        let funding_round_types = f_instance.getSelectedValues();
        let category_codes = c_instance.getSelectedValues();
        
        if(cities){
            let linkQuery = DB.linkQuery(yearMin, yearMax, cities, funding_round_types, category_codes, type);
            let linkResponse = DB.processQuery(linkQuery, DB.formatLinkData);

            let nodeQuery = DB.nodeQuery(linkQuery);
            let nodeResponse = DB.processQuery(nodeQuery, DB.formatNodeData);
            
            Promise.all([linkResponse, nodeResponse])
                .then(values => {

                    graph.links = values[0];
                    graph.nodes = values[1];

                    networkData = JSON.stringify(graph);
                    networkGraph.update(networkData);
                }, err => {
                    console.log(err);
                });
        }
    }
    
    function legendUpdate(data){
        let colorTable = data;
        $("#legend").html('');
        $( "#legend" ).append( "<ul id='legend-body'></ul>" );
        
        for(let key in colorTable){
            //markup = "<li class='collection-item "+colorTable[key]+"'>"+key+"</li>";
            //markup = "<li class='collection-item' style='text-color:"+colorTable[key]+"'>"+key+"</li>";
            markup = `<li style='height:2vh;'>
                        <svg preserveAspectRatio='xMinYMin meet' viewBox='0 0 100 10'>
                            <text dx='2' dy='6' text-anchor='left' font-size='0.5vh'>${key}</text>
                            <line x1='80' y1='5' x2='100' y2='5' style='stroke:${colorTable[key]};stroke-width:1' />
                        </svg>
                    </li>`;
            $("#legend-body").append(markup);
        }
    }

   //Creating instances for each visualization
    let DB = new Database();
    let profileChart = new ProfileChart(DB);
    let directoryChart = new DirectoryChart(profileChart, DB);
    let networkGraph = new NetworkGraph(profileChart);
    //let mapData = null;
    //let timeData = null;
    let vcMap = new VCMap(directoryChart,networkGraph,networkUpdate, DB);
    let timeSelector= new TimeSelector(directoryChart,vcMap, legendUpdate);

    function init() {


        // TODO:

        // Onload instantiate the directory chart. Only load
        // data when the user clicks on a circle though. 
        directoryChart.initialize();



        // On filter, retrieve new data
        function updateMap(){
         
            var f_instance = M.FormSelect.getInstance($('#fundingType'));
            var c_instance = M.FormSelect.getInstance($('#categories'));

            let funding_round_types = f_instance.getSelectedValues();
            let catagory_codes = c_instance.getSelectedValues();
            
            let query = DB.mapQuery(funding_round_types, catagory_codes);
            DB.processQuery(query, DB.formatMapData)
                .then(e => {
                    mapData = JSON.stringify(e);
                    vcMap.initialize(mapData);
                }) 
                .then(() => {
                    vcMap.update();
                }, err => {
                    console.log(err);
                });
        }


        // On filter, retrieve new data
        function updateLine() {
            let operation = timeSelector.operation;
            var f_instance = M.FormSelect.getInstance($('#fundingType'));
            var c_instance = M.FormSelect.getInstance($('#categories'));

            let funding_round_types = f_instance.getSelectedValues();
            let catagory_codes= c_instance.getSelectedValues();

            query = DB.lineQuery(funding_round_types, catagory_codes, 'None', operation);
            DB.processQuery(query, DB.formatLineData)
                .then(e => {
                    lineData = e;
                    timeSelector.initiate(lineData);
                }) 
                .then(() => {
                    timeSelector.update();
                }, err => {
                    console.log(err);
                });
        }


        // On filter, retrieve new data
        function updateTransactionList() {

            var f_instance = M.FormSelect.getInstance($('#fundingType'));
            var c_instance = M.FormSelect.getInstance($('#categories'));

            let funding_round_types = f_instance.getSelectedValues();
            let catagory_codes= c_instance.getSelectedValues();

            directoryChart.cities = [];
            directoryChart.update();
        }


        function filterUpdates() {
            updateMap();
            updateLine();
            updateTransactionList();
        }
        
        $('select').formSelect($('select').on('change', filterUpdates));  
        filterUpdates();

        $('#linearScaling').click( function() {
            vcMap.changeScale("linear");
        });
        $('#logScaling').click( function() {
            vcMap.changeScale("log");
        });


        $('#counts').click( function() {
            timeSelector.operation = "COUNT"
            updateLine();
            // timeSelector.changeScale("linear");
        });
        $('#sums').click( function() {
            timeSelector.operation = "SUM"
            updateLine();
            // timeSelector.changeScale("log");
        });
        $('#averages').click( function() {
            timeSelector.operation = "AVG"
            updateLine();
            // timeSelector.changeScale("log");
        });
        $('#medians').click( function() {
            timeSelector.operation = "MEDIAN"
            updateLine();
            // timeSelector.changeScale("log");
        });
    
        
    }

    /**
     *
     * @constructor
     */
    function Main(){
        if(instance  !== null){
            throw new Error("Cannot instantiate more than one Class");
        }
    }

    /**
     *
     * @returns {Main singleton class |*}
     */
    Main.getInstance = function(){
        let self = this;
        if(self.instance == null){
            self.instance = new Main();
            init();
        }
        return instance;
    };

    // Wait till DB loads to initiate
    DB.db.then(() => {
        Main.getInstance();
    });
    
})();
// EOF