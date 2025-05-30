(() => {
    const projectDetails = document.getElementsByClassName("aside-box project-details-box")[0];

    const log = (msg) => console.log("%cLOQUI%c " + msg, "background-color: #6da2a8; border-radius: 2px; padding: 3px;", "");

    if (projectDetails != undefined) {
        const projectID = projectDetails.getElementsByTagName("section")[0]
            .getElementsByTagName("dd")[2].innerText;
        const projectName = document.getElementsByTagName("h1")[0].innerText;
        log("Found curseforge project. ID: " + projectID + " | Name: " + projectName);

        const actions = document.getElementsByClassName("actions")[0].getElementsByClassName("split-button")[0];

        actions.innerHTML = `
            <button class="btn-cta" style="background-color:rgb(79, 146, 103);" onclick="alert('Search on Loqui here');">
                <img src="chrome-extension://${chrome.runtime.id}/icon.png" style="max-height: 100%; max-width: min-content;">
                <span>Loqui</span>
            </button>
        ` + actions.innerHTML;

        log("Injected Loqui button");
    }
})();