# SPDX SBOM Viewer

A web-based tool designed to load, parse, and visualize very SPDX SBOM (Software Bill of Materials) files. Built with React, Vite, MUI, and Tanstack Table, it uses a Web Worker to handle multi-hundred-megabyte JSON files without freezing the browser, ensuring a smooth and responsive user experience.

## Key Features

- **Handles Large Files:** Efficiently processes SBOM files that would crash standard browser-based JSON viewers.
- **Non-Blocking UI:** Uses a Web Worker for parsing, so the interface remains responsive at all times.
- **Interactive Table:**
  - Powerful global search to filter packages.
  - Sortable columns.
  - Pagination for easy navigation of large datasets.
- **Customizable View:**
  - Toggle column visibility to focus on the data you need.
  - Expand any row to view the complete raw JSON data for that package.
- **Modern Tech Stack:** Fast, modern, and clean interface built with React, Vite, and MUI.

## How to Use

Simply open the deployed application link and you can start using the tool immediately.

1. **Upload File:** Click the "Upload SBOM File" button and select your JSON-formatted SPDX file.
2. **View Data:** The SBOM details and a paginated list of packages will appear.
3. **Search & Filter:** Use the search bar at the top to instantly filter packages across all visible columns.
4. **Filter by Package Type:** Use the "Package Type" dropdown to filter the list by specific PURL types found in the file (e.g., `oci`, `go`, `rpm`) or select "All Packages" to see everything.
5. **Inspect Packages:** Click on any table row to expand it and see the full, raw data for that specific package.
6. **Customize Columns:** Click the "Columns" button to show or hide columns to tailor the view to your needs.
7. **Load New File:** Click the "New SBOM" button to reset the viewer and upload a different file.

## Local Usage & Development

You can run this tool on your local machine for development or offline use.

### Option 1: Running the Production Build (Recommended for most users)

This method serves the optimized, production-ready version of the application. It's fast and doesn't require installing development dependencies.

1. **Clone the repository:**

   ```sh
   git clone git@github.com:vbelouso/sbom-spdx-viewer.git
   cd sbom-spdx-viewer
   ```

2. **Install dependencies:**

   ```sh
   npm install
   ```

3. **Build the application:**

   ```sh
   npm run build
   ```

   This command creates a static, optimized build in the `dist/` directory.

4. **Serve the build locally:** The easiest way to serve the `dist` folder is with the `serve` package.

   ```sh
   npx serve dist
   ```

5. Open your browser and navigate to the local address provided (usually `http://localhost:3000`).

### Option 2: Running the Development Server (For developers)

This method starts a development server with Hot Module Replacement (HMR), ideal for making code changes.

1. **Clone and enter the repository** (if you haven't already).

2. **Install dependencies:**

   ```sh
   npm install
   ```

3. **Run the development server:**

   ```sh
   npm run dev
   ```

4. Open your browser and navigate to the local address provided (usually `http://localhost:5173`).
