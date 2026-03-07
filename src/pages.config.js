/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 */
import Admin from './pages/Admin';
import Battles from './pages/Battles';
import CaseOpen from './pages/CaseOpen';
import Cases from './pages/Cases';
import Coinflip from './pages/Coinflip';
import Crash from './pages/Crash';
import Deposit from './pages/Deposit';
import Home from './pages/Home';
import Inventory from './pages/Inventory';
import Leaderboard from './pages/Leaderboard';
import Referrals from './pages/Referrals';
import Rewards from './pages/Rewards';
import Upgrade from './pages/Upgrade';
import __Layout from './Layout.jsx';

export const PAGES = {
  "Admin": Admin,
  "Battles": Battles,
  "CaseOpen": CaseOpen,
  "Cases": Cases,
  "Coinflip": Coinflip,
  "Crash": Crash,
  "Deposit": Deposit,
  "Home": Home,
  "Inventory": Inventory,
  "Leaderboard": Leaderboard,
  "Referrals": Referrals,
  "Rewards": Rewards,
  "Upgrade": Upgrade,
}

export const pagesConfig = {
  mainPage: "Home",
  Pages: PAGES,
  Layout: __Layout,
};