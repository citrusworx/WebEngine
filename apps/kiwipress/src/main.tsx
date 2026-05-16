import { mount } from "@citrusworx/sigjs";
import "@citrusworx/juice/styles";
import { App } from "./App";
import { router } from "./router";
import { Home } from "./pages/home/Home";
import { Contact } from "./pages/contact/Contact";
import { Developers } from "./pages/developers/Developers";
import { GetKiwiPress } from "./pages/getKiwipress/GetKiwiPress";
import { HowItWorks } from "./pages/howItWorks/HowItWorks";
import { Login } from "./pages/login/Login";
import { Welcome } from "./pages/wizard/steps/Welcome";
import { Blueprints as WizardBlueprints } from "./pages/wizard/steps/Blueprints";
import { Configure } from "./pages/wizard/steps/Configure";
import { Database } from "./pages/wizard/steps/Database";
import { Domain as WizardDomain } from "./pages/wizard/steps/Domain";
import { Payment } from "./pages/wizard/steps/Payment";
import { Provisioning } from "./pages/wizard/steps/Provisioning";
import { Live } from "./pages/wizard/steps/Live";
import { Scale } from "./pages/wizard/steps/Scale";
import { Projects } from "./pages/app/pages/Projects";
import { Blueprints as AppBlueprints } from "./pages/app/pages/Blueprints";
import { Billing } from "./pages/app/pages/Billing";
import { Activity } from "./pages/app/pages/Activity";
import { Settings } from "./pages/app/pages/Settings";
import { Account } from "./pages/app/pages/Account";

mount(<App />, document.getElementById("root")!);

router
    .set("/", <Home />)
    .set("/contact", <Contact />)
    .set("/developers", <Developers />)
    .set("/get-kiwipress", <GetKiwiPress />)
    .set("/how-it-works", <HowItWorks />)
    .set("/login", <Login />)
    .set("/wizard", <Welcome />)
    .set("/wizard/welcome", <Welcome />)
    .set("/wizard/blueprints", <WizardBlueprints />)
    .set("/wizard/configure", <Configure />)
    .set("/wizard/database", <Database />)
    .set("/wizard/domain", <WizardDomain />)
    .set("/wizard/payment", <Payment />)
    .set("/wizard/provisioning", <Provisioning />)
    .set("/wizard/live", <Live />)
    .set("/wizard/scale", <Scale />)
    .set("/app", <Projects />)
    .set("/app/projects", <Projects />)
    .set("/app/blueprints", <AppBlueprints />)
    .set("/app/billing", <Billing />)
    .set("/app/activity", <Activity />)
    .set("/app/settings", <Settings />)
    .set("/app/account", <Account />)

router.start();
router.navigate(window.location.pathname);
