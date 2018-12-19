class NetworkGraph {
    constructor(profileChart) {
        
        this.profileChart = profileChart;
        this.selected = "None";
        //d3.select('#networkGraph').html('NETWORK');
        
        this.width = 1500;
        this.height = 1000;
       
        this.svg = d3.select("#networkGraph").append("svg")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .attr("viewBox", "0 0 "+this.width+" "+this.height);
            
        //this.link = this.svg.append("g")
        //    .attr("class", "links");
        //this.node = this.svg.append("g")
        //    .attr("class", "nodes");
        //
        //Color scheme
        this.color = d3.scaleOrdinal(d3.schemeCategory20);
        
        //Force setup
        this.simulation = d3.forceSimulation();
        this.simulation
                .force("link", d3.forceLink()
                .strength(0.2)
                .id(function(d){return d.name;})
                .distance(function(){return 80;}))
                .force("charge", d3.forceManyBody().strength(-250).distanceMax(200).distanceMin(60))
                .force("collide", d3.forceCollide(function(){return 5;}))
                .force("center", d3.forceCenter(this.width/2,this.height/2))
                .force("x", d3.forceX().strength(0.005))
                .force("y", d3.forceY().strength(0.005));
                
        //this.simulation.alphaDecay(0.4).alphaTarget(0.01).alphaMin(0.1);
        this.simulation.restart().alpha(1).alphaDecay(0.01).alphaTarget(0.29).alphaMin(0.3).velocityDecay(0.6);

 
        
    }
    
    update(data) {
        var self = this;
        //console.log('network graph update: ', data);
        
        self.data = JSON.parse(data);
        self.updateProfile();
        
        var graph = self.data;
    
   
        
        graph.nodes.forEach(function(nodes){
        
            nodes.title = nodes.name;
            nodes.x = self.width/2;
            nodes.y = self.height/2;
    
        });

        let simulation = self.simulation;
        let svg = self.svg;
        let width = self.width;
        let height = self.height;
        
        svg.selectAll("*").remove();
        
        simulation
            .nodes(graph.nodes);
        
        simulation.force("link")
            .links(graph.links);
        
        simulation.restart().alpha(1);
   
        var link = svg.append("g")
            .attr("class", "links")
            .selectAll("line")
            .data(graph.links)
            .enter().append("line")
            .attr('stroke', 'black')
            .attr("opacity","0.5")
            .attr("stroke-width", function() { return 1;});
            
        ////set radius scale
        //var maxValue = d3.max(graph.nodes, function(d){return d.value;});
        //
        //var radiusScale = d3.scaleSqrt()
        //    .domain([0, maxValue])
        //    .range([2, 15]);

        var node = svg.append("g")
            .attr("class", "nodes")
            .selectAll("circle")
            .data(graph.nodes)
            .enter().append("circle")
            //.filter(function(d){return d.num > 0;})
            .attr("r", function(d){
                d.r = 20;
                return d.r;
            })
            .attr("fill", function(d) {
            
                return self.color(d.type);
            })
            .attr("opacity","0.5")
            .attr("stroke", function() {
                return 'black';
            })
            .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));
            
        //node
        //    .enter().append("title")
        //    .text(function(d) {return d.title;});
            
    
        
        //// maybe do city centroids
        var label = svg.append('g')
            .attr("class", "label")
            .selectAll("text")
            .data(graph.nodes)
            .enter().append("text")
            .text(function(d){return d.name;})
            .attr("dx", 0)
            .attr("dy", 5)
            .attr("font-size", "1.5vh")
            .attr("text-anchor", "middle")
            .attr("fill", function() {
            return "black";
            })
            .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));


        //Simulation update and viewport binding behaivior
        simulation.on("tick", function ticked() {
            
            link
            
                .attr("x1", function(d) {return Math.max(0, Math.min(width, d.source.x));})
                .attr("y1", function(d) {return Math.max(0, Math.min(height, d.source.y));})
                .attr("x2", function(d) {return Math.max(0, Math.min(width, d.target.x));})
                .attr("y2", function(d) {return Math.max(0, Math.min(height, d.target.y));});
            
            node
                
                .attr("cx", function(d) {return Math.max(d.r, Math.min(width - d.r, d.x));})
                .attr("cy", function(d) {return Math.max(d.r, Math.min(height - d.r, d.y));});
                
            label
            
                .attr("x", function(d) {return Math.max(d.r, Math.min(width - d.r, d.x));})
                .attr("y", function(d) {return Math.max(d.r, Math.min(height - d.r, d.y));});
            
        });

        

        
        function dragstarted(d) {
            
            if (!d3.event.active) simulation.restart().alphaTarget(1);
            d.fx = d.x;
            d.fy = d.y;
       
        }
         
        function dragged(d) {
            d.fx = d3.event.x;
            d.fy = d3.event.y;
            
        }
         
        function dragended(d) {
            if (!d3.event.active) simulation.alphaDecay(0.01).alphaTarget(0.01).alphaMin(0.01);
          
            d.fx = null;
            d.fy = null;
        
        }

    }
    
    updateProfile(){
        var self = this;
        //if no slection, make profile display info on the new selection
        //if selection, revert profile back to default display for self.data.type = "city" or = "entity"
      
        self.selected = {"type":"clicked type", "value":"clicked name"};
        // Update profile chart                                     
        let profileData = JSON.stringify(self.selected);
        self.profileChart.update(profileData);
    }
    

}