import { auth } from './firebaseConfig.js';
import { saveProfilePic } from './profiles.js';

const TEAM_LOGOS = [
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

export function renderTeamLogoPicker({ containerId = 'logoSelection', previewId = 'profilePicPreview' } = {}) {
  const logoSelection = document.getElementById(containerId);
  const profilePicPreview = document.getElementById(previewId);
  if (!logoSelection) return;

  logoSelection.innerHTML = '';
  TEAM_LOGOS.forEach((team) => {
    const div = document.createElement('div');
    div.classList.add('profile-pic-option');

    const img = document.createElement('img');
    img.src = `images/NFL LOGOS/${team}`;
    img.alt = team;

    div.appendChild(img);
    logoSelection.appendChild(div);

    div.addEventListener('click', async () => {
      if (!auth.currentUser) {
        alert('You must be logged in to set a profile picture.');
        return;
      }
      if (profilePicPreview) profilePicPreview.src = img.src;

      try {
        await saveProfilePic(auth.currentUser.uid, img.src);
        document.querySelectorAll('.profile-pic-option').forEach((opt) => opt.classList.remove('selected'));
        div.classList.add('selected');
      } catch (e) {
        console.error('Error saving profile picture:', e);
        alert('Failed to save profile picture. Please try again.');
      }
    });
  });
}
