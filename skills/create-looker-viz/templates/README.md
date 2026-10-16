# {title}

This project was engineered using the Looker Custom Visualization Generator.

## Project Structure

*   `src/{project_name}.json`: Defines the data and style configuration for the properties panel.
*   `src/main.tsx`: Registers the custom visualization plugin with Looker.
*   `src/App.tsx`: The main React component that handles data subscription and local mocking.
*   `src/{comp_name}.tsx`: The visualization component (renders the {viz_type}).
*   `src/utils/types.ts`: Auto-generated strict TypeScript types for data and styles.
*   `vite.config.ts`: Configured to bundle the project into a single `bundle.js` file.

## Local Development

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Start the development server:
    ```bash
    npm run dev
    ```
3.  Open the local preview URL (usually `http://localhost:5173`) in your browser. You will see the visualization rendering with mock data.

## Deployment to Looker

1.  Build the production package:
    ```bash
    npm run build
    ```
    This will generate the `dist/bundle.js` single bundle file.
{deploy_instructions}
