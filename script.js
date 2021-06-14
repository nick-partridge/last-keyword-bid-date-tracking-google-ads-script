function main() {

        /************ KEYWORD FILTERING SETTINGS ************/

        //MINIMUM IMPRESSIONS 
        var keyword_impressions = '0';

        //MINIMUM CLICKS
        var keyword_clicks = '0';

        //MINIMUM COST
        var keyword_cost = '0';

        //MINIMUM CONVERSIONS
        var keyword_conversions = '0';

        //DATE RANGE - //TODAY, YESTERDAY, LAST_7_DAYS, THIS_WEEK_SUN_TODAY, THIS_WEEK_MON_TODAY, LAST_WEEK, LAST_14_DAYS, LAST_30_DAYS, LAST_WEEK, LAST_BUSINESS_WEEK, LAST_WEEK_SUN_SAT, THIS_MONTH, LAST_MONTH 
        var date_range = 'LAST_30_DAYS';

        //LABEL - IF YOU WANT TO TARGET CERTAIN KEYWORDS BY LABEL, CREATE A LABEL IN THE GOOGLE ADS INTERFACE FIRST, APPLY THAT LABEL TO WHATEVER KEYWORDS YOU WANT TO TRACK, AND 
        //THEN APPLY THE LABEL TO THE target_label VARIABLE - target_label = 'my_label_example';
        var target_label = '';

        /************ NO NEED TO CHANGE ANYTHING BELOW THIS LINE ************/

        var label_prefix = 'Last Bid Change:';
        var first_run_label = label_prefix + ' First Run';

        var label = target_label.length > 0 ? AdsApp.labels().withCondition("Name = " + target_label).get().next() : '';
        var labelId = target_label.length > 0 ? label.getId() : '';
        var targeted_label = target_label.length > 0 ? " AND Labels CONTAINS_ANY ['" + labelId + "']" : '';

        var now = new Date();
        var time_zone = AdsApp.currentAccount().getTimeZone();
        var the_day = Utilities.formatDate(now, time_zone, "dd-MM-yyyy");

        var keyword_conversions_adjusted = Number(keyword_conversions) - 1;
        var keyword_counter = [];

        var keywords = AdsApp.report(
            "SELECT Criteria, Status, BiddingStrategyType, AdGroupStatus, CampaignStatus, Labels, CpcBid, Id, AdGroupId" +
            " FROM KEYWORDS_PERFORMANCE_REPORT " +
            " WHERE " +
            " AdGroupStatus = 'ENABLED' " +
            " AND Status = 'ENABLED' " +
            " AND Clicks >= " + keyword_clicks + "" +
            " AND Impressions >= " + keyword_impressions + "" +
            " AND Cost >= " + keyword_cost + "" +
            " AND Conversions > " + keyword_conversions_adjusted + "" +
            " AND CampaignStatus = 'ENABLED' " +
            targeted_label +
            " AND BiddingStrategyType = 'MANUAL_CPC' " +
            " DURING " + date_range + "");

        var keyword = keywords.rows();
        while (keyword.hasNext()) {
            var report_keyword = keyword.next();
            var united_keyword = AdsApp.keywords().withIds([
                [report_keyword.AdGroupId, report_keyword.Id]
            ]).get();
            keyword_counter.push(united_keyword);
            if (united_keyword.hasNext()) {
                var united_keyword_next = united_keyword.next()

                if (report_keyword.Labels.indexOf(label_prefix) !== -1 && parseFloat(report_keyword.Labels.match(/Bid:(.*)/)[1].replace('"]', "")) !== parseFloat(report_keyword.CpcBid)) {
                    Logger.log(united_keyword_next.getText() + " bid changed from " + parseFloat(report_keyword.Labels.match(/Bid:(.*)/)[1].replace('"]', "")) + " to " + report_keyword.CpcBid);
                    united_keyword_next.removeLabel(report_keyword.Labels.match(/Last Bid Change(.*)/)[0].replace('"]', ""));
                    try {
                        united_keyword_next.applyLabel(label_prefix + the_day + " - " + "Bid: " + report_keyword.CpcBid);
                    } catch (err) {
                        AdsApp.createLabel(label_prefix + " " + the_day + " - " + "Bid: " + report_keyword.CpcBid, '', '#2C78C9');
                        united_keyword_next.applyLabel(label_prefix + " " + the_day + " - " + "Bid: " + report_keyword.CpcBid);
                    }
                } else if (report_keyword.Labels.indexOf(label_prefix) === -1) {
                    Logger.log("First run for " + united_keyword_next.getText())
                    try {
                        united_keyword_next.applyLabel(first_run_label + " - " + "Bid: " + report_keyword.CpcBid);
                    } catch (err) {
                        AdsApp.createLabel(first_run_label + " - " + "Bid: " + report_keyword.CpcBid, '', '#2C78C9');
                        united_keyword_next.applyLabel(first_run_label + " - " + "Bid: " + report_keyword.CpcBid);
                    }
                }
            }
        }

        var labelSelector = AdsApp.labels().withCondition("Name CONTAINS '" + label_prefix + "'");

        var labelIterator = labelSelector.get();
        Logger.log(labelIterator.totalNumEntities() + " labels and " + keyword_counter.length + " keywords")
        if (labelIterator.totalNumEntities() > keyword_counter.length) {
            while (labelIterator.hasNext()) {
                var labeld = labelIterator.next();
                if (labeld.keywords().get().totalNumEntities() === 0) {
                    labeld.remove();
                }
            }
        }
    }
