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

    //Creating instances for each visualization
    let DB = new Database();
    let profileChart = new ProfileChart(DB);
    let directoryChart = new DirectoryChart(profileChart, DB);
    let networkGraph = new NetworkGraph(profileChart);
    // let nextChart = new NextChart();
    // let nextChart = new NextChart();
    // {"year":2013,"type":"city","cities":["Kansas City"]} 
    function networkUpdate(data){
        data = JSON.parse(data);
        let graph = {};
        let yearMin = data.yearMin;
        let yearMax = data.yearMax;
        let type = data.type;
        let cities = data.cities;
        if(cities){
            let linkQuery = DB.linkQuery(yearMin, yearMax, cities, type);
            let linkResponse = DB.processQuery(linkQuery, DB.formatLinkData);

            let nodeQuery = DB.nodeQuery(linkQuery);
            let nodeResponse = DB.processQuery(nodeQuery, DB.formatNodeData);
            //console.log('link and node queries: ', linkQuery, nodeQuery)
            Promise.all([linkResponse, nodeResponse])
                .then(values => {
                    //console.log('node and link responses: ', values);
                    graph.links = values[0];
                    graph.nodes = values[1];

                    networkData = JSON.stringify(graph);
                    networkGraph.update(networkData);
                }, err => {
                    console.log(err);
                });
        }
        // $.ajax({
        //     type: 'POST',
        //     contentType: 'application/json',
        //     data: JSON.stringify(data),
        //     dataType: 'json',
        //     url: 'network',
        //     success: function (e) {
        //         networkData = JSON.stringify(e);
        //         networkGraph.update(networkData);
        //     },
        //     error: function(error) {
        //         console.log(error);
        //     }
        // });
    }

    // Kick off query to get initial state
    let mapData = null;
    let timeData = null;
    let vcMap = new VCMap(directoryChart,networkGraph,networkUpdate);
    let timeSelector= new TimeSelector(directoryChart,vcMap);

    function init() {
        // let testQ = DB.lineQuery();
        // let testRes = DB.processQuery(testQ, DB.formatLineQuery)
        // console.log(testRes);

        // TODO:
        // INITIALIZE AND CREATE FORCE DIRECTED GRAPH
        // SEND AN AJAX REQUEST TO app.js FOR INFO
        // ON SUCCESS, CREATE THE GRAPH
        // ALSO NEED TO SET UP FORCE DIRECTED GRAPH UPDATING
        

        // Onload instantiate the directory chart. Only load
        // data when the user clicks on a circle though. 
        directoryChart.initialize();

        // Onload display map data without filters
        let query = DB.mapQuery(["total"],["total"]);
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


        
        // Onload display year selector
        // d3.json('data/metadata.json', (err, data) => {
        //     if(err){
        //         console.log(err);
        //     }
        //     timeData = JSON.stringify(data);
        //     console.log("timeData:" + timeData);
        //     let timeSelector= new TimeSelector(directoryChart,vcMap);
        //     timeSelector.initiate(timeData);
        //     timeSelector.refreshMap(2013);
        //     timeSelector.update(timeData);
        // });

         //Onload display year selector
        //query = DB.lineQuery(funding_round_type=["total"], catagory_code=["total"]);
        ////query = DB.lineQuery(funding_round_type=["series-a", "series-b"], catagory_code=["advertising", "web"]);
        //DB.processQuery(query, DB.formatLineData)
        //    .then(e => {
        //        lineData = e;
        //        timeSelector.initiate(lineData);
        //    }) 
        //    .then(() => {
        //        timeSelector.update();
        //    }, err => {
        //        console.log(err);
        //    });
        
        
        // On load, populate filter options
        //let filterWorker = function(){
            
            //// funding round types
            //query = DB.filtersQuery('funding_round_type', 'cb_funding_rounds');
            //DB.processQuery(query, DB.formatFilterData)
            //    .then(e => {
            //        let funding_round_types = JSON.parse(JSON.stringify(e)).sort();
            //        // from helpers.js
            //        populateDropdown("fundingType", funding_round_types, defaultValue="total", defaultText="total");
            //        $('select').formSelect($('select').on('change', filterUpdates));
            //        
            //    }, err => {
            //        console.log(err);
            //    });
            //
            //// category types
            //query = DB.filtersQuery('category_code', 'cb_objects');
            //DB.processQuery(query, DB.formatFilterData)
            //    .then(e => {
            //        let categories = JSON.parse(JSON.stringify(e)).sort();
            //        populateDropdown("categories", categories, defaultValue="total", defaultText="total");
            //        $('select').formSelect($('select').on('change', filterUpdates));
            //        
            //    }, err => {
            //        console.log(err);
            //    });
        //};

        // On filter, retrieve new data
        function updateMap(){
         
            var f_instance = M.FormSelect.getInstance($('#fundingType'));
            var c_instance = M.FormSelect.getInstance($('#categories'));

            let funding_round_types = f_instance.getSelectedValues();
            let catagory_codes = c_instance.getSelectedValues();
            
            console.log("funding types: ", funding_round_types);
            console.log("catagory types: ", catagory_codes);
            
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

            var f_instance = M.FormSelect.getInstance($('#fundingType'));
            var c_instance = M.FormSelect.getInstance($('#categories'));

            let funding_round_types = f_instance.getSelectedValues();
            let catagory_codes= c_instance.getSelectedValues();
            
            console.log("funding types: ", funding_round_types);
            console.log("catagory types: ", catagory_codes);

            // let test_funding_round_types = ['series-a', 'series-b'];
            // let test_catagory_code = ['advertising', 'analytics'];

            query = DB.lineQuery(funding_round_types, catagory_codes);
            // query = DB.lineQuery(funding_round_type, catagory_code);
            DB.processQuery(query, DB.formatLineData)
                .then(e => {
                    lineData = e;
                    // console.log("new line data: " + lineData);
                    timeSelector.initiate(lineData);
                }) 
                .then(() => {
                    timeSelector.update();
                }, err => {
                    console.log(err);
                });
        }

        function filterUpdates() {
            console.log("Filter Updates");
            updateMap();
            updateLine();
        }
        
        //Promise.all([filterWorker]).then(()=>{filterUpdates();});
        $('select').formSelect($('select').on('change', filterUpdates));  
        filterUpdates();
        //d3.select('#fundingType')
        //  .on('change', filterUpdates);
        //
        //d3.select('#categories')
        //  .on('change', filterUpdates);


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

            //called only once when the class is initialized
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