import fetch from "node-fetch";
import * as vscode from "vscode";

const displayNearestAdhan = (timings: Object) => {
  const today = new Date();

  let times = Object.values(timings);
  let timesToPray: { hours: number; minutes?: string }[] = [];

  const hour = today.getHours();
  const minutes = today.getMinutes();

  console.log("hour : " + hour);
  console.log("minutes : " + minutes);

  times.forEach((time: string) => {
    let aux = time.replace(" (CET)", "").split(":");

    console.log(aux[0] + " : " + aux[1]);

    if (
      (Number.parseInt(aux[0]) == hour && Number.parseInt(aux[1]) > minutes) ||
      (Number.parseInt(aux[0]) == hour + 1 &&
        Number.parseInt(aux[1]) <= minutes)
    ) {
      timesToPray.push({
        hours: 0,
        minutes: aux[1],
      });
    } else if (Number.parseInt(aux[0]) > hour) {
      timesToPray.push({
        hours: Number.parseInt(aux[0]),
      });
    }
  });

  if (timesToPray.length === 0) {
    vscode.window.showErrorMessage("No prayers left for today !");
  } else {
    if (timesToPray.findIndex((time) => time.minutes != undefined) != -1) {
      vscode.window.showInformationMessage("Next Prayer in less than an hour");
    } else {
      const nearestHour =
        timesToPray.reduce((a, b) => {
          return Math.abs(b.hours - hour) < Math.abs(a.hours - hour) ? b : a;
        }).hours - hour;

      vscode.window.showInformationMessage(
        `Next Prayer in ${nearestHour} hour${nearestHour == 1 ? "" : "s"}`
      );
    }
  }
};

const prayerTimes = async (city: string, country: string) => {
  try {
    let today = new Date();

    let resp = await fetch(
      `http://api.aladhan.com/v1/calendarByCity?city=${city}&country=${country}&month=${
        today.getMonth() + 1
      }&year=${today.getFullYear()}`
    );
    let { data, code } = await resp.json();

    if (code != 200) {
      console.log(data);
      throw data;
    }
    let prayerTimes = data[today.getDate() - 1].timings;
    delete prayerTimes.Sunrise;
    delete prayerTimes.Sunset;
    delete prayerTimes.Imsak;
    delete prayerTimes.Midnight;

    displayNearestAdhan(prayerTimes);
  } catch (error) {
    vscode.window.showErrorMessage(error.toString());
  }
};

export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "prayers-reminder" is now active!'
  );

  // let disposable = vscode.commands.registerCommand(
  //   "prayers-reminder.adhan",
  //   () => {
  vscode.window.showInformationMessage("Welcome brother/sister");

  let cityInbox = vscode.window.createInputBox();
  let countryInbox = vscode.window.createInputBox();

  cityInbox.title = "Adhan : Insert city";
  countryInbox.title = "Adhan : Insert country";

  cityInbox.show();

  cityInbox.onDidAccept((_) => {
    let city = cityInbox.value;
    cityInbox.dispose();

    countryInbox.show();

    countryInbox.onDidAccept((_) => {
      let country = countryInbox.value;

      countryInbox.dispose();
      prayerTimes(city, country);
    });
  });
  // }
  // );

  // context.subscriptions.push(disposable);
}

export function deactivate() {}
