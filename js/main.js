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
    let profileChart = new ProfileChart();
    let directoryChart = new DirectoryChart(profileChart);
    let networkGraph = new NetworkGraph(profileChart);
    // let nextChart = new NextChart();
    // let nextChart = new NextChart();
    
    function networkUpdate(data){
        $.ajax({
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(data),
            dataType: 'json',
            url: 'network',
            success: function (e) {
                networkData = JSON.stringify(e);
                networkGraph.update(networkData);
            },
            error: function(error) {
                console.log(error);
            }
        });
    }

    // Kick off query to get initial state
    let mapData = null;
    let timeData = null;
    let vcMap = new VCMap(directoryChart,networkGraph,networkUpdate);

    let kickOffData = {"numRows":2};

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
        $.ajax({
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(["None", "None"]),
            dataType: 'json',
            url: 'map',
            success: function (e) {
                mapData = JSON.stringify(e);
                // Load first chart
                new Promise((resolve, reject) => {
                    resolve();
                })
                    .then(() => {
                        vcMap.initialize(mapData);
                    })
                    .then(() => {
                        vcMap.update();
                    });

            },
            error: function(error) {
                console.log(error);
            }
        });
        
        // Onload display year selector
        $.ajax({
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(kickOffData),
            dataType: 'json',
            url: 'timeselector',
            success: function (e) {
                timeData = JSON.stringify(e);
                // Load first chart
                let timeSelector= new TimeSelector(directoryChart,vcMap);
                timeSelector.initiate(timeData);
                timeSelector.refreshMap(2013);
                timeSelector.update(timeData);

            },
            error: function(error) {
                console.log(error);
            }
        });

          // On load, populate filter options
        $.ajax({
            type: 'POST',
            contentType: 'application/json',
            data: null,
            dataType: 'json',
            url: 'filters',
            success: function (e) {
                funding_round_types = JSON.parse(JSON.stringify(e['funding_round_type'])).sort();
                categories = JSON.parse(JSON.stringify(e['categories'])).sort();

                // funding type options
                populateDropdown("fundingType", funding_round_types, defaultValue="None", defaultText="total") //From helpers.js

                // category options
                populateDropdown("categories", categories, defaultValue="None", defaultText="total") //From helpers.js
            },
            error: function(error) {
                console.log(error);
            }
        });


        // On filter, retrieve new data
        function updateMap() {
            data = [];
            data.push(d3.select('#fundingType').property('value'));
            data.push(d3.select('#categories').property('value'));
            $.ajax({
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(data),
                dataType: 'json',
                url: 'map',
                success: function (e) {
                    mapData = JSON.stringify(e);
                    // Load first chart
                    vcMap.initialize(mapData);
                    vcMap.update();

                },
                error: function(error) {
                    console.log(error);
                }
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