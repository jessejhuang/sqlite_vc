/*
 * Root file that handles instances of all the charts and loads the visualization
 */
(function(){
    /**
     * Creates instances for every chart (classes created to handle each chart;
     * the classes are defined in the respective javascript files.
     */
    let instance = null;

    //Creating instances for each visualization
    let DB = new Database();
    let profileChart = new ProfileChart();
    let directoryChart = new DirectoryChart(profileChart, DB);
    let networkGraph = new NetworkGraph(profileChart);
    // let nextChart = new NextChart();
    // let nextChart = new NextChart();
    // {"year":2013,"type":"city","cities":["Kansas City"]} 
    function networkUpdate(data){
        data = JSON.parse(data);
        let graph = {};
        let year = data['year'];
        let type = data['type'];
        let cities = data['cities'];
        if(cities){
            let linkQuery = DB.linkQuery(year, cities, type);
            let linkResponse = DB.processQuery(linkQuery, DB.formatLinkData);

            let nodeQuery = DB.nodeQuery(linkQuery);
            let nodeResponse = DB.processQuery(nodeQuery, DB.formatNodeData);
            console.log('link and node queries: ', linkQuery, nodeQuery)
            Promise.all([linkResponse, nodeResponse])
                .then(values => {
                    console.log('node and link responses: ', values);
                    graph['links'] = values[0];
                    graph['nodes'] = values[1];

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

    function init() {

        // TODO:
        // INITIALIZE AND CREATE FORCE DIRECTED GRAPH
        // SEND AN AJAX REQUEST TO app.js FOR INFO
        // ON SUCCESS, CREATE THE GRAPH
        // ALSO NEED TO SET UP FORCE DIRECTED GRAPH UPDATING
        

        // Onload instantiate the directory chart. Only load
        // data when the user clicks on a circle though. 
        directoryChart.initialize();

        // Onload display map data without filters
        let query = DB.mapQuery();
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
        d3.json('data/metadata.json', (err, data) => {
            if(err){
                console.log(err);
            }
            timeData = JSON.stringify(data);
            let timeSelector= new TimeSelector(directoryChart,vcMap);
            timeSelector.initiate(timeData);
            timeSelector.refreshMap(2013);
            timeSelector.update(timeData);
        });

        // On load, populate filter options
        // funding round types
        query = DB.filtersQuery('funding_round_type', 'cb_funding_rounds');
        DB.processQuery(query, DB.formatFilterData)
            .then(e => {
                let funding_round_types = JSON.parse(JSON.stringify(e)).sort();
                // from helpers.js
                populateDropdown("fundingType", funding_round_types, defaultValue=undefined, defaultText="total");
            }, err => {
                console.log(err);
            });

        // category types
        query = DB.filtersQuery('category_code', 'cb_objects');
        DB.processQuery(query, DB.formatFilterData)
            .then(e => {
                let categories = JSON.parse(JSON.stringify(e)).sort();
                populateDropdown("categories", categories, defaultValue=undefined, defaultText="total");
            }, err => {
                console.log(err);
            });

        // On filter, retrieve new data
        function updateMap(){
            let funding_round_type = d3.select('#fundingType').property('value');
            let catagory_code = d3.select('#categories').property('value');
            let query = DB.mapQuery(funding_round_type, catagory_code);
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

        d3.select('#fundingType')
          .on('change', updateMap);

        d3.select('#categories')
          .on('change', updateMap);

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
        let self = this
        if(self.instance == null){
            self.instance = new Main();

            //called only once when the class is initialized
            init();
        }
        return instance;
    }

    Main.getInstance();
})();
// EOF