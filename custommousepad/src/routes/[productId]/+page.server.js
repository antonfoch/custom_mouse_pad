export const load = async (loadEvent) => {
    const {fetch} = loadEvent;
    const response = await fetch('https://www.googleapis.com/webfonts/v1/webfonts?key=AIzaSyCqT68inXVb0W51AozG_sRNozC8L0VSrhA');
    const json = await response.json();
    return json
}