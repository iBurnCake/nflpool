// teams.js
import { auth } from './firebaseConfig.js';
import { saveProfilePic } from './profiles.js';

const TEAMS = [
  "arizona-cardinals-logo.png","atlanta-falcons-logo.png","baltimore-ravens-logo.png","buffalo-bills-logo.png",
  "carolina-panthers-logo.png","chicago-bears-logo.png","cincinnati-bengals-logo.png","cleveland-browns-logo.png",
  "dallas-cowboys-logo.png","denver-broncos-logo.png","detroit-lions-logo.png","green-bay-packers-logo.png",
  "houston-texans-logo.png","indianapolis-colts-logo.png","jacksonville-jaguars-logo.png","kansas-city-chiefs-logo.png",
  "la-rams-logo.png","los-angeles-chargers-logo.png","los-angeles-rams-logo.png","miami-dolphins-logo.png",
  "minnesota-vikings-logo.png","new-england-patriots-logo.png","new-orleans-saints-logo.png","new-york-giants-logo.png",
  "new-york-jets-logo.png","oakland-raiders-logo.png","philadelphia-eagles-logo.png","pittsburgh-steelers-logo.png",
  "san-francisco-49ers-logo.png","seattle-seahawks-logo.png","tampa-bay-buccaneers-logo.png","tennessee-titans-logo.png",
  "washington-commanders-logo.png","washington-redskins-logo.png","xqc-logo.png"
];

export function renderTeamLogoPicker({ containerId, previewId }) {
  const container = document.getElementById(containerId);
  const preview   = document.getElementById(previewId);
  if (!container) return;

  container.innerHTML = '';
  TEAMS.forEach((file) => {
    const div = document.createElement('div');
    div.className = 'profile-pic-option';
    const img = document.createElement('img');
    img.src = `images/NFL LOGOS/${file}`;
    img.alt = file;
    div.appendChild(img);
    container.appendChild(div);

    div.onclick = () => {
      if (!auth.currentUser) {
        alert('You must be logged in to set a profile picture.');
        return;
      }
      if (preview) preview.src = img.src;
      document.querySelectorAll('.profile-pic-option').forEach(el => el.classList.remove('selected'));
      div.classList.add('selected');
      saveProfilePic(auth.currentUser.uid, img.src)
        .catch((e) => console.error('Error saving profile picture:', e));
    };
  });
}
