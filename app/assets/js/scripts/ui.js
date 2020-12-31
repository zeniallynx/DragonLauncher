setTimeout(() => {
    $('#loadingContainer').fadeOut(500, () => {
        $('#landingContainer').fadeIn(500, () => {
        })
    })
}, 500)


const VIEWS = {
    landing: '#landingContainer',
    settings: '#settingsContainer'
}

function switchView(current, next, onCurrentFade = () => {}, onNextFade = () => {}){
    currentView = next
    $(`${current}`).fadeOut(500, () => {
        onCurrentFade()
        $(`${next}`).fadeIn(500, () => {
            onNextFade()
        })
    })
}

function setModal(title, content, button) {
    document.getElementById('modalTitleLabel').innerHTML = title;
    document.getElementById('modalContentLabel').innerHTML = content;
    document.getElementById('modalButtonLabel').innerHTML = button;
}
