// API base url
const baseUrl = "https://www.balldontlie.io/api/v1/";

// All player data
let allPlayerStats = {};

// Form submit button
const analyzeButton = $("#btn-analyze");

// Canvas where chart is drawn
const canvas = document.getElementById("myChart");

// Canvas is initially empty
let isCanvasBlank = true;

// Will hold chart object
let chart = null;

//Prevent form from reloading page
$("#form-stats").submit(function (e) {
  e.preventDefault();
});

// Form submit button clicked
analyzeButton.click(function () {
  // Hides all error alerts
  $(".alert").hide();

  // Validating that user chose at least one stats type
  let allSelectedStats = $('input[type="checkbox"]:checked');
  if (allSelectedStats.length == 0) {
    $("#stats-error").show("fade");
    return;
  }

  // Will hold the player types selected (Ex. Points, Rebounds, Assists)
  let statsOptions = [];

  // Adding the value to statsOptions array
  allSelectedStats.each(function () {
    statsOptions.push($(this).val());
  });

  // Getting player name from input
  let playerName = $("#player-name").val().trim().toLowerCase();
  let playerNameArr = playerName.split(" ");

  // Checks if both first and lase name of player is provided
  // If a name is missing, error aler is shown
  if (playerNameArr.length < 2) {
    $("#player-name-error").show("fade");
    return;
  }

  // Getting player id, if player not found error alert is shown
  if (!allPlayerStats.hasOwnProperty(playerName))
    if (!hasPlayer(playerName)) {
      $("#player-error").show("fade");
      return;
    }

  // User selected playing season
  let season = $("#select-season").val();

  // If season not provided, stop execution
  if (!season) return;

  // number games for which data results are retrieved
  let countVal = $("#numGames").val();

  // Checks if player stats are available for season
  // If no stats are found and error alert is shown
  if (!hasPlayerStats(playerName, season, countVal)) {
    $("#season-error").show("fade");
    return;
  }

  // Will hold player stats based on provided stats types (Ex. Points)
  let data = [];

  // Adding player stats to data array
  for (stat of statsOptions) data.push(allPlayerStats[playerName][stat]);

  // Get chart type from input
  let chartType = $("#select-chart").val();

  // If no chart type is provided stop execution
  if (!chartType) return;

  // Checks if canvas is empty
  if (isCanvasBlank)
    //Create chart
    chart = makeChart(
      chartType,
      data,
      statsOptions,
      playerName.toUpperCase() + " STATS"
    );
  else {
    // Clear canvas
    chart.destroy();
    // Create chart
    chart = makeChart(
      chartType,
      data,
      statsOptions,
      playerName.toUpperCase() + " STATS"
    );
  }
});

/**
 * Makes API calls to retrieve player statistics if data is found and creates
 * a player stats object and adds it to the global allPlayerStats object.
 * @param  {String} playerName  User provided player name
 * @param  {String} season      User provided season to search data on
 * @param  {String} count       The number of games for which data is retrieved
 * @return {Boolean} Returns true if player data found. Returns false if player data not found.
 */
function hasPlayerStats(playerName, season, count) {
  // API stats endpoint
  const query = "stats?";

  // API call season filter to get data from specific season
  const seasonFilter = "seasons[]=";

  // API call player id filter to get data of specific player
  const playerIdFilter = "&player_ids[]=";

  // API call number of results filter to return a specific amount of game data
  const resultCountFilter = "&per_page=";

  // Player ID
  let playerID = allPlayerStats[playerName]["ID"];

  // Starting counts of stats
  let assists = 0;
  let blocks = 0;
  let points = 0;
  let rebounds = 0;
  let turnovers = 0;
  let steals = 0;
  let attemptedGoals = 0;
  let madeGoals = 0;

  // API data filter
  let playerFilter = seasonFilter + season + playerIdFilter + playerID;

  var request = new XMLHttpRequest();
  request.open(
    "GET",
    baseUrl + query + playerFilter + resultCountFilter + count,
    false
  );
  request.send(null);
  if (request.status === 200) {
    // Returned and parsed API JSON
    let apiData = JSON.parse(request.responseText);

    // No Data Found
    if (apiData.meta.total_count < 1) return false;

    // Aggregating stats data to respective stats type and keeping track of the amount of data returned
    for (dataItem of apiData.data) {
      assists += dataItem.ast;
      blocks += dataItem.blk;
      points += dataItem.pts;
      rebounds += dataItem.reb;
      turnovers += dataItem.turnover;
      steals += dataItem.stl;
      attemptedGoals += dataItem.fga;
      madeGoals += dataItem.fgm;
    }
  }
  // API request failed
  else {
    alert("Something went wrong.");
    return false;
  }

  // Creating player stats object
  let player = allPlayerStats[playerName];
  let playerStats = {
    assists: assists,
    blocks: blocks,
    points: points,
    rebounds: rebounds,
    turnovers: turnovers,
    steals: steals,
    attemptedGoals: attemptedGoals,
    madeGoals: madeGoals,
  };

  // Adding player stats to global allPlayersStats object
  Object.assign(player, playerStats);

  // Player stats found and added to global allPlayerStats object
  return true;
}

/**
 * Makes API call to search for player and retrieve the player's ID.
 * @param  {String} playerName User provided player name to search
 * @return {Boolean} Returns true if player was found and added to global allPlayerStats object.
 * Returns false if not player found or name does not match with API data.
 */
function hasPlayer(playerName) {
  // API player endpoint with search query parameter
  const query = "players?search=";

  // Formatted Name for query
  let pName = playerName.replace(" ", "+");

  // Player's first name
  let firstName = playerName.split(" ")[0];

  // Player's last name
  let lastName = playerName.split(" ")[1];

  var request = new XMLHttpRequest();
  // Request method and API player endpoint query
  request.open("GET", baseUrl + query + pName, false);
  // Send API request
  request.send(null);

  if (request.status === 200) {
    // Returned and parsed API JSON
    let apiData = JSON.parse(request.responseText);

    // Player name validity check
    if (apiData.meta.total_count < 1) return false; // No Player Found, stop execution
    if (apiData.data[0].first_name.toLowerCase() != firstName) return false; // First name does not match, stop execution
    if (apiData.data[0].last_name.toLowerCase() != lastName) return false; // Last name does not match, stop execution

    // Gets player id and constructs a player object with an ID attribute
    let playerID = apiData.data[0].id;
    let playerInfo = {
      [playerName]: {
        ID: playerID,
      },
    };

    // Add player name and id to global stats object
    Object.assign(allPlayerStats, playerInfo);

    // Player found and player object added to global allPlayerStats object
    return true;
  }
  // API request failed
  else {
    alert("Something went wrong.");
    return false;
  }
}

/**
 * Constructors a chart of the provided type using the Chart.js library
 * @param  {String} type    Type of chart that will be made (Ex. Bar Chart)
 * @param  {Array}  dataset Data of player statistics
 * @param  {Array}  labels  Player statistics types (Ex. Points)
 * @param  {String} title   Title given to the chart
 * @return {Chart Object} Chart object created using Chart.js library
 */
function makeChart(type, dataset, labels, title) {
  // Chart will now occupy the canvas
  isCanvasBlank = false;
  const ctx = canvas.getContext("2d");

  // If Doughnut Chart is being created a legend needed
  if (type == "doughnut") {
    // Creating chart object
    const myChart = new Chart(ctx, {
      // Chart type
      type: type,
      data: {
        // Player statistics types
        labels: labels,
        datasets: [
          {
            label: "",
            // Player statistics data
            data: dataset,
            // Chart elements colors
            backgroundColor: [
              "rgba(255, 99, 132, 0.2)",
              "rgba(54, 162, 235, 0.2)",
              "rgba(255, 206, 86, 0.2)",
              "rgba(75, 192, 192, 0.2)",
              "rgba(153, 102, 255, 0.2)",
              "rgba(255, 159, 64, 0.2)",
              "rgba(144, 12, 63, 0.2)",
              "rgba(255, 87, 51, 0.2)",
            ],
            borderColor: [
              "rgba(255, 99, 132, 1)",
              "rgba(54, 162, 235, 1)",
              "rgba(255, 206, 86, 1)",
              "rgba(75, 192, 192, 1)",
              "rgba(153, 102, 255, 1)",
              "rgba(255, 159, 64, 1)",
              "rgba(144, 12, 63, 1)",
              "rgba(255, 87, 51, 1)",
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        plugins: {
          // Chart title settings
          title: {
            display: true,
            text: title,
            font: {
              size: 20,
            },
          },
          // Chart legend settings
          legend: {
            display: true,
            position: "right",
          },
        },
        scales: {
          // Chart y-axis settings
          y: {
            beginAtZero: true,
          },
        },
        // Chart will resize to fit container
        responsive: true,
        maintainAspectRatio: false,
      },
    });
    // Chart object created
    return myChart;
  }
  // No legend is needed so created chart will not display a legend
  else {
    // Creating chart object
    const myChart = new Chart(ctx, {
      // Chart type
      type: type,
      data: {
        // Player statistics types
        labels: labels,
        datasets: [
          {
            label: "",
            // Player statistics data
            data: dataset,
            // Chart elements colors
            backgroundColor: [
              "rgba(255, 99, 132, 0.2)",
              "rgba(54, 162, 235, 0.2)",
              "rgba(255, 206, 86, 0.2)",
              "rgba(75, 192, 192, 0.2)",
              "rgba(153, 102, 255, 0.2)",
              "rgba(255, 159, 64, 0.2)",
              "rgba(144, 12, 63, 0.2)",
              "rgba(255, 87, 51, 0.2)",
            ],
            borderColor: [
              "rgba(255, 99, 132, 1)",
              "rgba(54, 162, 235, 1)",
              "rgba(255, 206, 86, 1)",
              "rgba(75, 192, 192, 1)",
              "rgba(153, 102, 255, 1)",
              "rgba(255, 159, 64, 1)",
              "rgba(144, 12, 63, 1)",
              "rgba(255, 87, 51, 1)",
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        plugins: {
          // Chart title settings
          title: {
            display: true,
            text: title,
            font: {
              size: 20,
            },
          },
          // Chart legend is hidden
          legend: {
            display: false,
          },
        },
        scales: {
          // Chart y-axis settings
          y: {
            beginAtZero: true,
          },
        },
        // Chart will resize to fit container
        responsive: true,
        maintainAspectRatio: false,
      },
    });
    // Chart object created
    return myChart;
  }
}
