/*
 * Root file that handles instances of all the charts and loads the visualization
 */
console.time("Main");
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
        if(cities){
            let linkQuery = DB.linkQuery(yearMin, yearMax, cities, type);
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
        console.log("ColorTable: ", colorTable);
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
            
            //console.log("funding types: ", funding_round_types);
            //console.log("catagory types: ", catagory_codes);
            
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
            
            //console.log("funding types: ", funding_round_types);
            //console.log("catagory types: ", catagory_codes);

            query = DB.lineQuery(funding_round_types, catagory_codes);
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

            self.directoryChart.cities = [];
            directoryChart.update();
            // self.directoryChart.cities = self.selectedCities;
            // self.directoryChart.update();

            //console.log("funding types: ", funding_round_types);
            //console.log("catagory types: ", catagory_codes);


            // query = DB.lineQuery(funding_round_types, catagory_codes);
            // DB.processQuery(query, DB.formatLineData)
            //     .then(e => {
            //         lineData = e;
            //         // timeSelector.initiate(lineData);
            //     }) 
            //     .then(() => {
            //         timeSelector.update();
            //     }, err => {
            //         console.log(err);
            //     });
        }


        function filterUpdates() {
            console.log("Filter Updates");
            updateMap();
            updateLine();
            updateTransactionList();
        }
        
        $('select').formSelect($('select').on('change', filterUpdates));  
        filterUpdates();


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
console.timeEnd("Main");
// EOF