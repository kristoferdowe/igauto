require("dotenv").config();
const puppeteer = require("puppeteer");
const Instauto = require("instauto");

const options = {
  cookiesPath: "./cookies.json",

  
  //Set .env variables equal to these
  username: process.env.INSTA_USERNAME,
  password: process.env.INSTA_PASSWORD,

  //careful, overdo this and you may be flagged
  maxFollowsPerHour: 18,
  maxFollowsPerDay: 147,
  maxLikesPerDay: 42,

  dontUnfollowUntilTimeElapsed: 3 * 24 * 60 * 60 * 1000,

  // people you want to skip
  excludeUsers: [],

  // change this to false when you're ready to send it
  dryRun: true,
};

(async () => {
  let browser;

  try {
    browser = await puppeteer.launch({ headless: false });

    // create a local db
    const instautoDb = await Instauto.JSONDB({
      // all users already followed
      followedDbPath: "./followed.json",
      // all users unfollowed
      unfollowedDbPath: "./unfollowed.json",
      //  all likes
      likedPhotosDbPath: "./liked-photos.json",
    });

    //FOLLOW

    const instauto = await Instauto(instautoDb, browser, options);

    // list of usernames as strings that you want to follow the followers of
    const usersToFollowFollowersOf = [""];

    // takes previous list and goes through their followers
    await instauto.followUsersFollowers({
      usersToFollowFollowersOf,
      skipPrivate: true,
      enableLikeImages: true,
    });

    await instauto.sleep(10 * 60 * 1000);

    // UNFOLLOW

    await instauto.unfollowNonMutualFollowers();

    await instauto.sleep(10 * 60 * 1000);

    // unfollows the autofollowed users regardless of if they follow us or not
    await instauto.unfollowOldFollowed({ ageInDays: 60 });

    console.log("completed run");

    await instauto.sleep(30000);
  } catch (err) {
    console.error(err);
  } finally {
    console.log("run complete, closing app");
    if (browser) await browser.close();
  }
})();
