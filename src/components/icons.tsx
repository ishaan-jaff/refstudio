export const CircleIcon = () => (
  <div className="flex h-6 w-6 items-center justify-center">
    <div className="h-2 w-2 shrink-0 rounded-2xl bg-current" />
  </div>
);

export const SearchIcon = () => (
  <div className="flex h-6 w-6 items-center justify-center">
    <svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M19.6 21L13.3 14.7C12.8 15.1 12.225 15.4167 11.575 15.65C10.925 15.8833 10.2333 16 9.5 16C7.68333 16 6.146 15.3707 4.888 14.112C3.63 12.8533 3.00067 11.316 3 9.5C3 7.68333 3.62933 6.146 4.888 4.888C6.14667 3.63 7.684 3.00067 9.5 3C11.3167 3 12.854 3.62933 14.112 4.888C15.37 6.14667 15.9993 7.684 16 9.5C16 10.2333 15.8833 10.925 15.65 11.575C15.4167 12.225 15.1 12.8 14.7 13.3L21 19.6L19.6 21ZM9.5 14C10.75 14 11.8127 13.5623 12.688 12.687C13.5633 11.8117 14.0007 10.7493 14 9.5C14 8.25 13.5623 7.18733 12.687 6.312C11.8117 5.43667 10.7493 4.99933 9.5 5C8.25 5 7.18733 5.43767 6.312 6.313C5.43667 7.18833 4.99933 8.25067 5 9.5C5 10.75 5.43767 11.8127 6.313 12.688C7.18833 13.5633 8.25067 14.0007 9.5 14Z"
        fill="currentcolor"
      />
    </svg>
  </div>
);

export const CloseIcon = () => (
  <div className="flex h-6 w-6 shrink-0 items-center justify-center">
    <svg height="12" viewBox="0 0 12 12" width="12" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6.00012 7.41433L1.75748 11.657L0.343262 10.2428L4.5859 6.00012L0.343262 1.75748L1.75748 0.343262L6.00012 4.5859L10.2428 0.343262L11.657 1.75748L7.41433 6.00012L11.657 10.2428L10.2428 11.657L6.00012 7.41433Z"
        fill="currentcolor"
      />
    </svg>
  </div>
);

export const OpenIcon = () => (
  <div className="flex h-6 w-6 shrink-0 items-center justify-center">
    <svg height="12" viewBox="0 0 16 12" width="16" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1.6 12C1.16 12 0.783201 11.853 0.469601 11.559C0.156001 11.265 -0.000531975 10.912 1.35823e-06 10.5V1.5C1.35823e-06 1.0875 0.156801 0.734251 0.470401 0.440251C0.784001 0.146251 1.16053 -0.000498727 1.6 1.27334e-06H6.4L8 1.5H14.4C14.84 1.5 15.2168 1.647 15.5304 1.941C15.844 2.235 16.0005 2.588 16 3V10.5C16 10.9125 15.8432 11.2657 15.5296 11.5597C15.216 11.8537 14.8395 12.0005 14.4 12H1.6Z"
        fill="currentcolor"
      />
    </svg>
  </div>
);

export function ChevronDownIcon() {
  return (
    <div className="flex h-6 w-6 items-center justify-center">
      <svg height="8" viewBox="0 0 12 8" width="12" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M1.41 0.290039L6 4.88004L10.59 0.290039L12 1.71004L6 7.71004L0 1.71004L1.41 0.290039Z"
          fill="currentcolor"
        />
      </svg>
    </div>
  );
}

export function ChevronUpIcon() {
  return (
    <div className="flex h-6 w-6 items-center justify-center">
      <svg height="8" viewBox="0 0 12 8" width="12" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M10.59 7.71008L6 3.12008L1.41 7.71008L-1.2414e-07 6.29008L6 0.290083L12 6.29008L10.59 7.71008Z"
          fill="currentcolor"
        />
      </svg>
    </div>
  );
}

export function NotVisibleIcon() {
  return (
    <div className="flex h-6 w-6 items-center justify-center">
      <svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M19.8 22.5998L15.6 18.4498C15.0167 18.6331 14.4293 18.7708 13.838 18.8628C13.2467 18.9548 12.634 19.0005 12 18.9998C9.48333 18.9998 7.24167 18.3041 5.275 16.9128C3.30833 15.5215 1.88333 13.7171 1 11.4998C1.35 10.6165 1.79167 9.79547 2.325 9.0368C2.85833 8.27814 3.46667 7.59914 4.15 6.9998L1.4 4.1998L2.8 2.7998L21.2 21.1998L19.8 22.5998ZM12 15.9998C12.1833 15.9998 12.3543 15.9915 12.513 15.9748C12.6717 15.9581 12.8423 15.9248 13.025 15.8748L7.625 10.4748C7.575 10.6581 7.54167 10.8291 7.525 10.9878C7.50833 11.1465 7.5 11.3171 7.5 11.4998C7.5 12.7498 7.93767 13.8125 8.813 14.6878C9.68833 15.5631 10.7507 16.0005 12 15.9998ZM19.3 16.4498L16.125 13.2998C16.2417 13.0165 16.3333 12.7288 16.4 12.4368C16.4667 12.1448 16.5 11.8325 16.5 11.4998C16.5 10.2498 16.0623 9.18714 15.187 8.3118C14.3117 7.43647 13.2493 6.99914 12 6.9998C11.6667 6.9998 11.354 7.03314 11.062 7.0998C10.77 7.16647 10.4827 7.26647 10.2 7.39981L7.65 4.8498C8.33333 4.56647 9.03333 4.35414 9.75 4.2128C10.4667 4.07147 11.2167 4.00047 12 3.9998C14.5167 3.9998 16.7583 4.69547 18.725 6.0868C20.6917 7.47814 22.1167 9.28247 23 11.4998C22.6167 12.4831 22.1123 13.3958 21.487 14.2378C20.8617 15.0798 20.1327 15.8171 19.3 16.4498ZM14.675 11.8498L11.675 8.8498C12.1417 8.76647 12.571 8.80414 12.963 8.9628C13.355 9.12147 13.6923 9.35047 13.975 9.6498C14.2583 9.9498 14.4627 10.2958 14.588 10.6878C14.7133 11.0798 14.7423 11.4671 14.675 11.8498Z"
          fill="currentcolor"
        />
      </svg>
    </div>
  );
}

export function VisibleIcon() {
  return (
    <div className="flex h-6 w-6 items-center justify-center">
      <svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 16C13.25 16 14.3127 15.5623 15.188 14.687C16.0633 13.8117 16.5007 12.7493 16.5 11.5C16.5 10.25 16.0623 9.18733 15.187 8.312C14.3117 7.43667 13.2493 6.99933 12 7C10.75 7 9.68733 7.43767 8.812 8.313C7.93667 9.18833 7.49933 10.2507 7.5 11.5C7.5 12.75 7.93767 13.8127 8.813 14.688C9.68833 15.5633 10.7507 16.0007 12 16ZM12 14.2C11.25 14.2 10.6123 13.9373 10.087 13.412C9.56167 12.8867 9.29933 12.2493 9.3 11.5C9.3 10.75 9.56267 10.1123 10.088 9.587C10.6133 9.06167 11.2507 8.79933 12 8.8C12.75 8.8 13.3877 9.06267 13.913 9.588C14.4383 10.1133 14.7007 10.7507 14.7 11.5C14.7 12.25 14.4377 12.8877 13.913 13.413C13.3883 13.9383 12.7507 14.2007 12 14.2ZM12 19C9.56667 19 7.35 18.3207 5.35 16.962C3.35 15.6033 1.9 13.7827 1 11.5C1.9 9.21667 3.35 7.39567 5.35 6.037C7.35 4.67833 9.56667 3.99933 12 4C14.4333 4 16.65 4.67933 18.65 6.038C20.65 7.39667 22.1 9.21733 23 11.5C22.1 13.7833 20.65 15.6043 18.65 16.963C16.65 18.3217 14.4333 19.0007 12 19Z"
          fill="currentcolor"
        />
      </svg>
    </div>
  );
}

export function UnselectedRadioIcon() {
  return (
    <div className="flex h-6 w-6 items-center justify-center">
      <svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
        <rect fill="white" height="14.5" rx="1.25" stroke="#EFF1F4" strokeWidth="1.5" width="14.5" x="4.75" y="4.75" />
      </svg>
    </div>
  );
}

export function SelectedRadioIcon() {
  return (
    <div className="flex h-6 w-6 items-center justify-center">
      <svg height="16" viewBox="0 0 16 16" width="16" xmlns="http://www.w3.org/2000/svg">
        <path
          clipRule="evenodd"
          d="M2 0C0.895431 0 0 0.895431 0 2V14C0 15.1046 0.895431 16 2 16H14C15.1046 16 16 15.1046 16 14V2C16 0.895431 15.1046 0 14 0H2ZM2 8.06784L3.41421 6.65363L6.56425 9.80366L13 3.36791L14.4142 4.78213L6.56425 12.6321L2 8.06784Z"
          fill="currentcolor"
          fillRule="evenodd"
        />
      </svg>
    </div>
  );
}
