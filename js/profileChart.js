class ProfileChart {

    constructor(DB) {
        this.height = 550;
        this.db = DB;
        this.modal = M.Modal.getInstance($('#profModal').modal());

        this.headerSVG = d3.select('#profileHeader').append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('id', 'profHeaderSVG');

        this.summarySVG = d3.select('#profSummary').append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('id', 'profSummarySVG');

        this.cdfSVG = d3.select('#profCDF').append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('id', 'profCdfSVG');

        this.barSVG = d3.select('#profBar').append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('id', 'profBarSVG');

        this.scatterSVG = d3.select('#profScatter').append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('id', 'profLineSVG');

        this.y1 = 10; // Starting y value for data attribute
        this.initiate();
    }

    numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    initiate() {
        let self = this;
        self.headerSVG.append('svg:image')
            .attr('id', 'profileLogo')
            .attr('x', '5%')
            .attr('y', '5%')
            .attr('width', 100)
            .attr('height', 100)
            .attr('xlink:href', './images/default_logo.jpg');
        self.headerSVG.append('a')
            .attr('xlink:href', 'https://washuvis.github.io/venturecapital/docs/')
            .attr('id', 'profileLink')
            .append('text')
                .text('Venture Capital Visualizations')
                .attr('id', 'profileName')
                .attr('x', '15%')
                .attr('y', '50%')
                .style('font-size', '50px')
                .style('fill', '#0000EE');
        self.headerSVG.append('text')
            .text('Jack Grundy, Jesse Huang, John Kirchenbauer')
            .attr('id', 'profileDescription')
            .attr('x', '15%')
            .attr('y', '70%')
            .style('font-size', '15px')
        self.summarySVG.append('text')
            .text('Venture')
            .attr('id', 'profileType')
            .attr('x', '5%')
            .attr('y', `${self.y1}%`)
            .style('font-size', '20px');
        self.y1 += 15;
        self.summarySVG.append('text')
            .text('Year Founded: 2018')
            .attr('id', 'profileYearFounded')
            .attr('x', '5%')
            .attr('y', `${self.y1}%`)
            .style('font-size', '20px');
        self.y1 += 15;
        self.summarySVG.append('text')
            .text('City: St. Louis')
            .attr('id', 'profileCity')
            .attr('x', '5%')
            .attr('y', `${self.y1}%`)
            .style('font-size', '20px');
        self.y1 += 15;
        self.summarySVG.append('text')
            .text('Status: Operating')
            .attr('id', 'profileStatus')
            .attr('x', '5%')
            .attr('y', `${self.y1}%`)
            .style('font-size', '20px');
        self.y1 += 15;
        self.summarySVG.append('text')
            .text('First Funded: 2013')
            .attr('id', 'profileFirstFunded')
            .attr('x', '5%')
            .attr('y', `${self.y1}%`)
            .style('font-size', '20px');
        self.y1 += 15;
        self.summarySVG.append('text')
            .text('Last Funded: 2013')
            .attr('id', 'profileLastFunded')
            .attr('x', '5%')
            .attr('y', `${self.y1}%`)
            .style('font-size', '20px');
        self.y1 += 15;
        self.summarySVG.append('text')
            .text('Total Raised: $0')
            .attr('id', 'profileTotalFunding')
            .attr('x', '5%')
            .attr('y', `${self.y1}%`)
            .style('font-size', '20px');
        self.y1 += 15;
    }

    summary(data){
        let self = this;
        let companyType = data.entity_type === 'FinancialOrg' ? 'Entity Type: Venture' :
            data.entity_type === 'People' ? 'Entity Type: Person' :
            'Entity Type: VC Firm';
        let logo = data.logo_url ? data.logo_url : 'images/default_logo.jpg';
        let homepage = data.homepage_url ? data.homepage_url : 'https://www.pixar.com/404';
        let description = data.description ? data.description : data.short_description;
        let status = data['cb_objects.status'];

        let year = data['cb_funding_rounds.funded_at'];
        let yearFounded = data['founded_at'] ? data['founded_at'] : 'Unknown';
        let firstYear = data['first_funding_at'] ? data['first_funding_at'] : year;
        let lastYear = data['last_funding_at'] ? data['last_funding_at'] : year;

        let totalFunding = data.funding_total_usd
            ? data.funding_total_usd
            : '0';
        let fundingType = data['cb_funding_rounds.funding_round_type']
            ? data['cb_funding_rounds.funding_round_type'] !== 'other'
                ? `Funding Type: ${data['cb_funding_rounds.funding_round_type']}`
                : 'Funding Type: Wildcard'
            : 'Funding Type: N/A'
        
        let funding = data['cb_funding_rounds.raised_amount_usd'];

        d3.select('#profileLogo')
            .attr('xlink:href', logo);
        d3.select('#profileLink')
            .attr('xlink:href', homepage);
        d3.select('#profileName')
            .text(data.name);
        d3.select('#profileDescription')
            .text(description);
        d3.select('#profileType')
            .text(companyType);
        d3.select('#profileYearFounded')
            .text(`Year Founded: ${yearFounded}`);
        d3.select('#profileCity')
            .text(`City: ${data.city}`);
        d3.select('#profileStatus')
            .text(`Status: ${status}`);
        
        if(companyType === 'Venture'){
            d3.select('#profileTotalFunding')
                .text(`Total Raised: $${self.numberWithCommas(totalFunding)}`);
            d3.select('#profileFirstFunded')
                .text(`First Funded: ${firstYear}`);
            d3.select('#profileLastFunded')
                .text(`Last Funded: ${lastYear}`);
            funding = funding ? funding : totalFunding;
        }
        else{
            d3.select('#profileTotalFunding').text('');
            d3.select('#profileFirstFunded').text('');
            d3.select('#profileLastFunded').text('');
        }
    }

    cdf(history){
        
    }

    bar(history){
        
    }

    scatter(history){
        let self = this;
        const parseDate = d3.timeParse('%Y-%m-%d');
        let dates = history.map(d => parseDate(d.date));
        let amounts = history.map(d => d.amount);
        let xScale = d3.scaleTime()
            .domain([d3.min(dates), d3.max(dates)])
            .range([0, 700]);
        let yScale = d3.scaleLinear()
            .domain([0, d3.max(amounts)])
            .range([0, 130]);
        let xAxis = d3.axisBottom().scale(xScale);
        let yAxis = d3.axisLeft().scale(yScale);
        const colors = d3.scaleOrdinal(d3.schemeCategory10)
        self.scatterSVG.append('g')
            .attr('transform', 'translate(50, -10)')
            .call(yAxis);
        self.scatterSVG.append('g')
            .attr('transform', 'translate(65, 130)')
            .call(xAxis);
        self.scatterSVG.selectAll('.profScatterDot')
            .data(history)
            .enter()
            .append('circle')
            .attr('class', '.profScatterDot')
            .attr('r', 3.5)
            .attr('cx', d => xScale(parseDate(d.date)))
            .attr('cy', d => yScale(d.amount ? d.amount : 0))
            .attr('transform', 'translate(45, -40)')
            .style('fill', d => colors(d.fundingType));
    }

    update(name) {
        let self = this;
        self.modal.open();
        let query = self.db.profileQuery(name);
        self.db.processQuery(query, self.db.formatProfileData)
            .then(data => {
                self.summary(data);
                let history = data.history;
                console.log(`Name: ${name}, `, history);
                self.bar(history);
                self.scatter(history);
                self.cdf(history);
            }, err => {
                console.log(err);
            });
    }

}
// EOF