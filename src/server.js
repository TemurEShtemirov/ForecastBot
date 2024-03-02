import axios from "axios";
import { Telegraf, Markup } from "telegraf";
import "dotenv/config";

const botToken =
  process.env.BOT_TOKEN || "6602215576:AAH2vcaS3Ane7tmgr22BcDM5V1x9wVBRMyc";
const ACCUWEATHER_API_KEY =
  process.env.API_KEY || "PW2Ncly7BQbA43sm3NVbACYwBfCl05GM";

const bot = new Telegraf(botToken);

bot.start((ctx) => {
  ctx.reply("Welcome =)");
});

bot.command("weather", (ctx) => {
  ctx.reply(
    "Please share your location to get weather information.",
    Markup.keyboard([[Markup.button.locationRequest("Share Location")]])
  );
});

bot.command("info", (ctx) => {
  ctx.reply(`
  🌤️ Telegram Weather Bot 

Welcome to the Telegram Weather Bot! This bot helps you stay informed about the weather conditions in your area. Here's what you can do: 

Commands: 

    /start: Begin interacting with the bot.
    /weather: Share your location to receive the current weather forecast.
    /info: Learn more about the bot.
    /author: Find out about the creator of this bot.

How to Use:

    Start a chat with the bot.
    Use the /weather command to share your location.
    The bot will provide you with the latest weather forecast for your area.

About the Bot:
The Telegram Weather Bot is designed to provide you with quick and accurate weather updates based on your location. It's easy to use and ensures that you always know what to expect from the weather.

Feedback:
We're constantly working to improve our bot. If you have any feedback or suggestions, feel free to share them with us using the chat interface.

Enjoy using the Telegram Weather Bot, and stay ahead of the weather!

  `);
});

bot.command("author", (ctx) => {
  ctx.reply("Bot's Author is @y0ung_devel0per Temur Eshtemirov");
});

bot.on("location", async (ctx) => {
  try {
    const { latitude, longitude } = ctx.message.location;
    const locationKey = await getLocationKey(latitude, longitude);
    if (locationKey) {
      // Send a loading message
      const loadingMessage = await ctx.reply("🌦️");

      // Simulate a delay with setTimeout
      setTimeout(async () => {
        const weatherInfo = await fetchWeatherInfo(
          locationKey,
          "/forecasts/v1/daily/1day/"
        );

        // Remove the loading message once weather information is fetched
        await ctx.deleteMessage(loadingMessage.message_id);

        await ctx.reply(weatherInfo);
      }, 3000); // Adjust the delay time (in milliseconds) as needed
    } else {
      ctx.reply("Unable to fetch weather data.");
    }
  } catch (error) {
    console.error("An error occurred:", error);
    ctx.reply("An error occurred while processing your request.");
  }
});

async function getLocationKey(latitude, longitude) {
  try {
    const response = await axios.get(
      `http://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=${ACCUWEATHER_API_KEY}&q=${latitude},${longitude}`
    );
    if (response.status === 200) {
      return response.data.Key;
    } else {
      console.error("Error fetching location key:", response.statusText);
      return null;
    }
  } catch (error) {
    console.error("Error fetching location key:", error.message);
    return null;
  }
}

async function fetchWeatherInfo(locationKey, forecastType) {
  try {
    const response = await axios.get(
      `http://dataservice.accuweather.com${forecastType}${locationKey}?apikey=${ACCUWEATHER_API_KEY}&language=en-us&details=true&metric=true`
    );
    if (response.status === 200) {
      return formatWeatherInfo(response.data);
    } else {
      console.error("Error fetching weather data:", response.statusText);
      return "Unable to fetch weather data.";
    }
  } catch (error) {
    console.error("Error fetching weather data:", error.message);
    return "Unable to fetch weather data.";
  }
}

function formatWeatherInfo(data) {
  let weatherInfo = `☁️ Weather Today:\n`;

  // Include headline information
  weatherInfo += `📰 Headline: ${data.Headline.Text}\n`;

  if (Array.isArray(data.DailyForecasts)) {
    data.DailyForecasts.forEach((day) => {
      weatherInfo += `🗓️ Date: ${day.Date}\n`;
      weatherInfo += `🌡️ Temperature (Min/Max): ${day.Temperature.Minimum.Value}°C / ${day.Temperature.Maximum.Value}°C\n`;
      weatherInfo += `🌡️ Real Feel Temperature (Min/Max): ${day.RealFeelTemperature.Minimum.Value}°C (${day.RealFeelTemperature.Minimum.Phrase}) / ${day.RealFeelTemperature.Maximum.Value}°C (${day.RealFeelTemperature.Maximum.Phrase})\n`;
      weatherInfo += `🌧️ Precipitation: ${day.Day.PrecipitationType}\n`;

      // Check if wind information exists
      if (day.Day.Wind && day.Day.Wind.Speed && day.Day.Wind.Direction) {
        weatherInfo += `💨 Wind: ${day.Day.Wind.Speed.Value} ${day.Day.Wind.Speed.Unit} ${day.Day.Wind.Direction.Localized}\n`;
      }

      weatherInfo += `🏙️ Day: ${day.Day.IconPhrase}\n`;
      weatherInfo += `🌃 Night: ${day.Night.IconPhrase}\n\n`;
    });
  }

  return weatherInfo;
}

bot.telegram.setMyCommands([
  { command: "/start", description: "Start bot" },
  { command: "/weather", description: "Share your location 📍" },
  { command: "/info", description: "Get information about the bot 🤖" },
  { command: "/author", description: "Info About Author ✒️✒️✒️" },
]);

bot.on("message", (ctx) => {
  ctx.reply("Please use the available commands to interact with the bot.");
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
