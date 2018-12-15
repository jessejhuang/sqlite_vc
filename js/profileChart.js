class ProfileChart {

    constructor() {
        this.height = 550;
        this.svg = d3.select('#profileChart').append('svg')
            .attr('width', '100%')
            .attr('height', this.height)
            .attr('id', 'profileChart')
            .style('background', 'antiquewhite');
        this.y1 = 30; // Starting y value for data attribute
        this.y2 = 30;
        this.initiate();
    }

    initiate() {
        let self = this;
        self.svg.append('svg:image')
            .attr('id', 'profileLogo')
            .attr('x', '5%')
            .attr('y', '5%')
            .attr('width', 100)
            .attr('height', 100)
            .attr('xlink:href', './images/default_logo.jpg');
        self.svg.append('a')
            .attr('xlink:href', 'https://washuvis.github.io/venturecapital/docs/')
            .attr('id', 'profileLink')
            .append('text')
                .text('Venture Capital Visualizations')
                .attr('id', 'profileName')
                .attr('x', '15%')
                .attr('y', '15%')
                .style('font-size', '40px')
                .style('fill', '#0000EE');
        self.svg.append('text')
            .text('Jack Grundy, Jesse Huang, John Kirchenbauer')
            .attr('id', 'profileDescription')
            .attr('x', '15%')
            .attr('y', '20%')
            .style('font-size', '15px')
        self.svg.append('text')
            .text('Venture')
            .attr('id', 'profileType')
            .attr('x', '5%')
            .attr('y', `${self.y1}%`)
            .style('font-size', '20px');
        self.y1 += 5;
        self.svg.append('text')
            .text('Year Founded: 2018')
            .attr('id', 'profileYearFounded')
            .attr('x', '5%')
            .attr('y', `${self.y1}%`)
            .style('font-size', '20px');
        self.y1 += 5;
        self.svg.append('text')
            .text('City: St. Louis')
            .attr('id', 'profileCity')
            .attr('x', '5%')
            .attr('y', `${self.y1}%`)
            .style('font-size', '20px');
        self.y1 += 5;
        self.svg.append('text')
            .text('Status: Operating')
            .attr('id', 'profileStatus')
            .attr('x', '5%')
            .attr('y', `${self.y1}%`)
            .style('font-size', '20px');
        self.y1 += 5;
        self.svg.append('text')
            .text('First Funded: 2013')
            .attr('id', 'profileFirstFunded')
            .attr('x', '5%')
            .attr('y', `${self.y1}%`)
            .style('font-size', '20px');
        self.y1 += 5;
        self.svg.append('text')
            .text('Last Funded: 2013')
            .attr('id', 'profileLastFunded')
            .attr('x', '5%')
            .attr('y', `${self.y1}%`)
            .style('font-size', '20px');
        self.y1 += 5;
        self.svg.append('text')
            .text('Total Raised: $0')
            .attr('id', 'profileTotalFunding')
            .attr('x', '5%')
            .attr('y', `${self.y1}%`)
            .style('font-size', '20px');
        self.y1 += 5;

        self.svg.append('text')
            .text('Funding Year: 2013')
            .attr('id', 'profileFundingYear')
            .attr('x', '35%')
            .attr('y', `${self.y2}%`)
            .style('font-size', '20px');
        self.y2 += 5;
        self.svg.append('text')
            .text('Amount Raised: $0')
            .attr('id', 'profileFunding')
            .attr('x', '35%')
            .attr('y', `${self.y2}%`)
            .style('font-size', '20px');
        self.y2 += 5;
        self.svg.append('text')
            .text('Funding Type: Grant')
            .attr('id', 'profileFundingType')
            .attr('x', '35%')
            .attr('y', `${self.y2}%`)
            .style('font-size', '20px');
        self.y2 += 5;
    }

    directoryUpdate(data){
        console.log(data);
        let companyType = data.entity_type === 'FinancialOrg' ? 'VC Firm' : 'Venture'
        let logo = data.logo_url ? data.logo_url : 'static/images/default_logo.jpg';
        let homepage = data.homepage_url ? data.homepage_url : 'https://www.pixar.com/404';
        let description = data.description ? data.description : data.short_description;
        let status = data['cb_objects.status'];

        let year = data['YEAR(cb_funding_rounds.funded_at)'];
        let yearFounded = data['YEAR(founded_at)'] ? data['YEAR(founded_at)'] : 'Unknown';
        let firstYear = data['YEAR(first_funding_at)'] ? data['YEAR(first_funding_at)'] : year;
        let lastYear = data['YEAR(last_funding_at)'] ? data['YEAR(last_funding_at)'] : year;

        let totalFunding = data['FORMAT(funding_total_usd, 0)']
            ? `${data['FORMAT(funding_total_usd, 0)']}`
            : '0';
        let fundingType = data['cb_funding_rounds.funding_round_type']
            ? data['cb_funding_rounds.funding_round_type'] !== 'other'
                ? `Funding Type: ${data['cb_funding_rounds.funding_round_type']}`
                : 'Funding Type: Wildcard'
            : 'Funding Type: N/A'
        
        let funding = data['FORMAT(cb_funding_rounds.raised_amount_usd, 0)'];

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
                .text(`Total Raised: $${totalFunding}`);
            d3.select('#profileFirstFunded')
                .text(`First Funded: ${firstYear}`);
            d3.select('#profileLastFunded')
                .text(`Last Funded: ${lastYear}`);
            funding = funding ? funding : totalFunding;
            d3.select('#profileFunding')
                .text(`Amount Raised: $${funding}`);
        }
        else{
            d3.select('#profileTotalFunding').text('');
            d3.select('#profileFirstFunded').text('');
            d3.select('#profileLastFunded').text('');
            d3.select('#profileFunding')
                .text(`Amount Invested: $${funding}`);
        }
        d3.select('#profileFundingType')
            .text(fundingType);
    }

    update(data) {
        console.log(data);
        
    }
}
// EOF