import type { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { id } = context.params || {};

  return {
    redirect: {
      destination: `/properties/${id}`,
      permanent: false,
    },
  };
};

export default function AppPropertyRedirect() {
  return null;
}









